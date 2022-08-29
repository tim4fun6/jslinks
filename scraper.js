/* eslint-disable no-unused-vars */
const TelegramClient = window.gramjs.TelegramClient
const StringSession = window.gramjs.sessions.StringSession
const Logger = window.gramjs.extensions.Logger

/* globals TagConfig  */

const apiId = 1429899
const apiHash = 'c5a397226da24aff6a8dfb84c66f4cb1'

const isFunction = obj => !!(obj && obj.constructor && obj.call && obj.apply)

const fourDaysInSeconds = 60 * 60 * 24 * 4
const oldestMessageTimestamp = Date.now() / 1000 - fourDaysInSeconds

class ScrapedMessage {
  static URL_RE = /https?:\/\/[\]A-Za-z0-9._":/?#@!$&()*+,;%='[-]+/gm

  static fields = [
    'timestamp',
    'id',
    'chatId',
    'chatName',
    'senderName',
    'links',
    'body',
    'message'
  ]

  constructor(messageInfo) {
    ScrapedMessage.fields.forEach(k => {
      this[k] = messageInfo[k]
    })
    this.links = messageInfo.links.map(link => new ScrapedLink({ message: this, link }))
  }

  static fromTelegramMessage(message) {
    const senderObject = message.sender || { title: 'NO SENDER OBJECT' }
    const body = message.message || ''

    return new ScrapedMessage({
      timestamp: message.date,
      id: message.id,
      chatId: message.chat.id,
      chatName: message.chat.title,
      senderName:
        senderObject.title ||
        [ senderObject.firstName, senderObject.LastName ].filter(n => n).join(' '),
      body,
      links: Array.from(body.matchAll(ScrapedMessage.URL_RE), m => m[0]),
      message
    })
  }

  toJSON() {
    const json = Object.fromEntries(ScrapedMessage.fields.map(f => [ f, this[f] ]))
    json.links = json.links.map(sl => sl.link)
    return json
  }

  static fromJSON(json) {
    try {
      return new ScrapedMessage(JSON.parse(json))
    } catch (_error) {
      return null
    }
  }
}

class ScrapedLink {
  constructor({ message, link }) {
    this.message = message
    this.link = link
    this.tag = undefined
    this.number = undefined
    this.resolveTag()
  }

  static fields = [ 'message', 'link', 'tag', 'number' ]

  static GHEERS_SUBDOMAIN = /(?:\/\/|\.)(.*?)\.gheers/i

  static ZOOM_NUMBER = /zoom\.us\/.*?(\d{9,11})/

  tagGheersSubdomain(link = this.link) {
    const gheersMatch = link.match(ScrapedLink.GHEERS_SUBDOMAIN)
    if (gheersMatch) {
      return gheersMatch[1]
    } else {
      return null
    }
  }

  tagZoomRoom(link = this.link) {
    const number = this.zoomNumber(link)
    return TagConfig.tagsByRoom[number] || `${number}`
  }

  zoomNumber(link = this.link) {
    const zoomMatch = link.match(ScrapedLink.ZOOM_NUMBER)
    const number =
      zoomMatch ? Number.parseInt(zoomMatch[1], 10) :
        null

    if (number) {
      this.number = number
    }

    return number
  }

  tagNotInteresting(link = this.link) {
    if (TagConfig.keep.find(fragment => link.includes(fragment))) {
      return null
    } else {
      return 'not_interesting'
    }
  }

  resolveTag(link = this.link) {
    this.tag =
      this.tagNotInteresting(link) || this.tagGheersSubdomain(link) || this.tagZoomRoom(link)
    return this.tag
  }

  toJSON() {
    if (!this.tag) {
      this.resolveTag()
    }

    return Object.fromEntries(ScrapedLink.fields.map(f => [ f, this[f] ]))
  }

  static fromJSON(json) {
    try {
      return new ScrapedLink(JSON.parse(json))
    } catch (_error) {
      return null
    }
  }
}

class LinkAggregator {
  constructor() {
    this.mostRecent = {}
    this.latestUpdate = Math.floor(Date.now() / 1000)
    this.readFromStorage()
    this.mostRecentTime = 0
  }

  readFromStorage() {
    try {
      const storage = JSON.parse(localStorage.getItem('telegramLinks'))
      this.mostRecentTime = storage.mostRecentTime
      this.latestUpdate = storage.latestUpdate
      for (const link of Object.values(storage.MostRecent)) {
        this.addLink(link)
      }
    } catch (_error) {
      this.mostRecent = {}
      this.mostRecentTime = 0
      this.latestUpdate = Date.now()
    }
  }

  writeToStorage() {
    const { latestUpdate, mostRecentTime, mostRecent } = this
    const data = JSON.stringify({ latestUpdate, mostRecentTime, mostRecent })
    localStorage.setItem('telegramLinks', data)
  }

  clearStorage() {
    localStorage.setItem('telegramLinks', JSON.stringify({}))
    this.mostRecentTime = 0
  }

  stripLinksBeforeCutoff() {
    Object.keys(this.mostRecent).forEach(key => {
      if (this.mostRecent[key].message.timestamp < oldestMessageTimestamp) {
        delete this.mostRecent[key]
      }
    })
  }

  addLink(link) {
    const tag = link.tag
    const link_ts = link.message.timestamp
    const currentMostRecent = this.mostRecent[tag]

    if (tag === 'not_interesting') return

    if (!currentMostRecent || currentMostRecent.message.timestamp < link.message.timestamp) {
      this.mostRecent[tag] = link
    }

    if (link.message.timestamp > this.mostRecentTime) {
      this.mostRecentTime = link.message.timestamp
    }

    this.latestUpdate = Math.floor(Date.now() / 1000)
  }

  timeMetadataCallback(storageFn) {
    // storageFn should take two args; latest link and current time
    storageFn(this.mostRecentTime, this.latestUpdate)
  }

  get links() {
    this.stripLinksBeforeCutoff()
    return Object.values(this.mostRecent)
  }

  clear() {
    this.mostRecent = {}
  }
}

class TelegramGroupChatScraper {
  constructor({
    messageBatchSize,
    logLevel,
    phoneNumber,
    phoneCode,
    messageCallback,
    linkCallback
  }) {
    this.messageBatchSize = messageBatchSize || 100
    this.logLevel = logLevel || 'info'

    this.phoneNumber =
      isFunction(phoneNumber) ? phoneNumber :
        async () => phoneNumber
    this.phoneCode =
      isFunction(phoneCode) ? phoneCode :
        async () => phoneCode

    this.messageCallback =
      isFunction(messageCallback) ? messageCallback :
        message => console.log(message)
    this.linkCallback =
      isFunction(linkCallback) ? linkCallback :
        link => console.log(link)

    const session = new StringSession(localStorage.getItem('sessionString'))
    this.client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 })
  }

  set logLevel(newLevel) {
    this._logLevel = newLevel
    Logger.setLevel(newLevel)
  }

  get logLevel() {
    return this._logLevel
  }

  async connect() {
    const { phoneNumber, phoneCode } = this
    await this.client.start({ phoneNumber, phoneCode, onError: err => console.log(err) })
    localStorage.setItem('sessionString', this.client.session.save())
    const me = await this.client.getMe()
    this.mySenderName = [ me.firstName, me.lastName ].filter(x => x).join(' ')
  }

  async disconnect() {
    localStorage.setItem('sessionString', this.client.session.save())
    return await this.client.disconnect()
  }

  async publicChats() {
    if (!this.client.connected) throw new Error('not connected')

    const allDialogs = await this.client.getDialogs({})
    return allDialogs.filter(d => !d.isUser)
  }

  async scrape(dialog) {
    if (!this.client.connected) throw new Error('not connected')

    const scrapedMessages = []
    const iterOptions = { limit: this.messageBatchSize }

    for await (const message of this.client.iterMessages(dialog.id, iterOptions)) {
      const scrapedMessage = ScrapedMessage.fromTelegramMessage(message)

      if (scrapedMessage.timestamp < oldestMessageTimestamp) {
        break
      }

      if (scrapedMessage.senderName === this.mySenderName) {
        console.log(scrapedMessage)
        continue
      }

      scrapedMessages.push(scrapedMessage)
      if (this.linkCallback) {
        scrapedMessage.links.forEach(this.linkCallback.bind(this))
      }
      if (this.messageCallback) {
        this.messageCallback(scrapedMessage)
      }
    }
    if (scrapedMessages.length) {
      return scrapedMessages
    } else {
      return null
    }
  }
}
