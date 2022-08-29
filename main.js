/* globals luxon, UIValueModal, TelegramTable, BootstrapProgressBar, LinkAggregator, TelegramGroupChatScraper */
$(document).ready(async () => {
  const phoneModal = new UIValueModal({
    mainId: 'phoneNumberDialog',
    valueId: 'phoneNumber',
    submitId: 'phoneSubmit'
  })

  const codeModal = new UIValueModal({
    mainId: 'secretCodeDialog',
    valueId: 'secretCode',
    submitId: 'codeSubmit'
  })

  const telegramTable = new TelegramTable({
    tableId: 'links',
    reloadFn: async () => {
      await doTheScraping(),
        updateTimeMetadata()
    },
    resetFn: async () => {
      clearAggregator()
      doTheScraping()
    }
  })

  const progress = new BootstrapProgressBar({ progressBarId: 'progress' })

  const messagesAsScraped = []
  const allMessages = []
  const allLinks = []

  function processMessage(message) {
    messagesAsScraped.push(message)
    const bareMessage = message.toJSON()
    const bareLinks = message.links.map((link, idx) => {
      const bareLink = link.toJSON()
      bareLink.id = bareLink.message.id + '@' + idx
      delete bareLink.message
      return bareLink
    })

    allMessages.push(bareMessage)
    allLinks.push(...bareLinks)
  }

  const aggregator = new LinkAggregator()
  aggregator.readFromStorage()
  aggregator.stripLinksBeforeCutoff()

  telegramTable.rows = aggregator.links
    .map(TelegramTable.rowFromLink)
    .sort(TelegramTable.compareRows)

  const scraper = new TelegramGroupChatScraper({
    messageBatchSize: 50,
    logLevel: 'info',
    phoneNumber: async () => phoneModal.run(),
    phoneCode: async () => codeModal.run(),
    linkCallback: link => aggregator.addLink(link),
    messageCallback: processMessage
  })

  async function clearAggregator() {
    aggregator.clear()
    aggregator.clearStorage()
  }
  
  const feelingLucky = {
    links: new Set(),
    seen: new Set(), 
    clear: function () {
      this.links.clear()
      this.seen.clear()
    },
    refresh: function() { 
      aggregator.links.forEach(l => { this.links.add(l.link) })
      this.seen.forEach(l => { this.links.delete(l) })
    },
    chooseLink: function(){
      const idx = Math.floor(Math.random() * this.links.size)
      const array = Array.from(this.links)
      const link = array[idx]
      this.links.delete(link)
      this.seen.add(link)
      return link
    },
    resetHistory: function () {
      this.seen.forEach(l => { this.links.add(l) })
      this.seen.clear()
    }
  }

  $('#feeling-lucky').on('click', () => {
    const link = feelingLucky.chooseLink()
    window.open(link, '_blank')
  })

  $('#reset-my-luck').on('click', () => {
    feelingLucky.resetHistory()
  })
  
  async function doTheScraping() {
    await scraper.connect()
    progress.reset()
    telegramTable.dataTable.buttons().disable()
    $('#most-recent-link').html('<i>updating...</i>')
    $('#latest-update').html('<i>updating...</i>')

    const chats = await scraper.publicChats()
    const totalChats = chats.length
    let doneChats = 0

    while (chats.length > 0) {
      await scraper.scrape(chats.shift())

      telegramTable.rows = aggregator.links
        .map(TelegramTable.rowFromLink)
        .sort(TelegramTable.compareRows)
      doneChats = doneChats + 1
      progress.setProgress(Math.floor(100 * (1.0 * doneChats / totalChats)))
    }

    feelingLucky.refresh() 

    telegramTable.dataTable.buttons().enable()
    // if ($('tr').length === 7) {
    //   telegramTable.joinLinkColumnHeadings()
    // }

    updateTimeFormat()
  }

  function updateTimeMetadata() {
    aggregator.timeMetadataCallback(telegramTable.setTimeMetadata.bind(telegramTable))
    $('#most-recent-link').html(telegramTable.formattedLatestLink())
    $('#latest-update').html(telegramTable.formattedLatestUpdate())
  }

  async function scrape() {
    await doTheScraping()
    updateTimeMetadata()
  }

  setInterval(scrape, 1000 * 5 * 60)
  scrape()
  updateTimeFormat

  function formatTime(epochSeconds) {
    const timestamp = luxon.DateTime.fromSeconds(epochSeconds).setZone('America/New_York')
    const now = luxon.DateTime.fromMillis(Date.now()).setZone('America/New_York')
    const formattedTime = timestamp.toFormat('yyyy-LL-dd HH:mm:ss ZZZZ')
    const duration = now.diff(timestamp).shiftTo('days', 'hours', 'minutes','seconds').set({ seconds: 0 })
    const displayTerms = [ 'days', 'hours', 'minutes' ].filter(period => duration.get(period) > 0)
    const formattedDuration = duration.shiftTo(...displayTerms).toHuman()
    return `${formattedTime}<br/>ca. ${formattedDuration} ago`
  }

  function formatDuration(duration) {
    const wholeDays = Math.floor(duration.length('days'))
    if (wholeDays === 0) {
      return duration.toFormat("'ca.' h:mm 'ago'")
    }

    if (wholeDays === 1) {
      return duration.toFormat("'ca.' d 'day,' h:mm 'ago'")
    }

    return duration.toFormat("'ca.' d 'day,' h:mm 'ago'") 
  }

  // <div class="table-time">
  //   <span class="timestamp" style="display: none;">timestamp</span>
  //   <span class="display-time"></span>
  // </di>'
  

  function updateTimeFormat() {
    $('.table-time').each(function () {
      const epochSecondsString = $(this).find('.timestamp').text()
      const epochSeconds = parseInt(epochSecondsString, 10)
      const formatted = formatTime(epochSeconds)
      $(this).find('.display-time').html(formatted)
    })
  }

  setInterval(updateTimeFormat, 60000)

  const _jMessages = messagesAsScraped.map(msg => {
    const tmsg = msg.message
    tmsg.chat = '<deleted chat reference>'
    tmsg._chat = '<deleted _chat reference>'
    tmsg._client = '<deleted _client reference'
    tmsg.media = '<deleted media reference>'
    tmsg._forward = '<deleted _forward reference>'
    return tmsg
  })

  allMessages.forEach(m => delete m.message)

  // const allResults = { allMessages, jMessages, allLinks }

  // const div = document.createElement('div')
  // const p = document.createElement('p')
  // p.innerText = JSON.stringify(allResults)
  // div.append(p)
  // document.getElementsByTagName('body')[0].append(div)
})
