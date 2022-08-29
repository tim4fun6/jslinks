/* eslint-disable no-unused-vars */
/* global luxon */

class UIValueModal {
  constructor({ mainId, submitId, valueId }) {
    this.element = document.getElementById(mainId)
    this.modal = bootstrap.Modal.getOrCreateInstance(this.element)
    this.activePromise = null

    this.$element = $('#' + mainId)
    this.$valueElement = $('#' + valueId)
    this.$submitButton = $('#' + submitId)

    this.attachHandlers()
  }

  makePromise() {
    if (this.activePromise) {
      throw new Error('promise already active')
    }

    const promise = new Promise((resolve, reject) => {
      this.activePromise = { resolve, reject }
    })
    this.activePromise.promise = promise
    return promise
  }

  resolvePromise(value) {
    if (this.activePromise) {
      this.activePromise.resolve(value)
      this.activePromise = null
    }
  }

  rejectPromise(reason) {
    if (this.activePromise) {
      this.activePromise.reject(new Error(reason))
      this.activePromise = null
    }
  }

  get value() {
    return this.$valueElement.val()
  }

  set value(newValue) {
    this.$valueElement.val(newValue)
  }

  attachHandlers() {
    this.$valueElement.on('keypress', event => {
      if (event.which === 13) {
        event.preventDefault()
        this.activePromise.resolve(this.value)
        this.modal.hide()
      }
    })

    this.$submitButton.on('click', event => {
      event.preventDefault()
      this.activePromise.resolve(this.value)
      this.modal.hide()
    })

    this.$element.on('hidden.bs.modal', _event => {
      this.activePromise.reject('user cancelled')
    })
  }

  async run(currentValue) {
    this.value = currentValue
    this.modal.show()
    return this.makePromise()
  }
}

class TelegramTable {
  static rowFromLink(link) {
    return {
      time: link.message.timestamp,
      humanTime: TelegramTable.formatTime(link.message.timestamp),
      tag: link.tag || 'N/A',
      number: link.number || 'N/A',
      chatName: link.message.chatName,
      senderName: link.message.senderName,
      link: link.link,
      key: `${link.message.timestamp}-${link.tag}`
    }
  }

  static compareRows(first, second) {
    if (first.time && second.time && first.tag && second.tag) {
      return second.time - first.time || first.tag.localeCompare(second.tag)
    } else if (first.time && second.time) {
      return second.time - first.time
    } else {
      return 0
    }
  }

  static formatTime(epochSeconds) {
    const timestamp = luxon.DateTime.fromSeconds(epochSeconds).setZone('America/New_York')
    const now = luxon.DateTime.fromMillis(Date.now()).setZone('America/New_York')
    const formattedTime = timestamp.toFormat('yyyy-LL-dd HH:mm:ss ZZZZ')
    const duration = now.diff(timestamp).shiftTo('days', 'hours', 'minutes','seconds').set({ seconds: 0 })
    const displayTerms = [ 'days', 'hours', 'minutes' ].filter(period => duration.get(period) > 0)
    const formattedDuration = duration.shiftTo(...displayTerms).toHuman()
    return `${formattedTime} (ca. ${formattedDuration} ago)`
  }


  static renderTime(data, type, row, meta) {
    if (type === 'display') {
      return [
        '<div class="table-time">',
        `<span class="timestamp" style="display: none;">${data}</span>`,
        '<span class="display-time"></span>',
        '</di>'
      ].join('')
    }

    return data
  }

  static renderLink(data, type, row, meta) {
    if (type == 'display') {
      return [
        `<a href="${data}" target="_blank" role="button" rel="noreferrer noopener" class="btn btn-outline-primary text-nowrap">`,
        '<i class="bi bi-link-45deg text-primary"></i>Go</a>'
        //        '<button type="button" class="btn btn-outline-primary">',
        //         '<i class="bi bi-bookmark-plus-fill text-primary"></i>Bookmark</button>',
        //        '<i class="bi-alarm" style="font-size: 2rem; color: cornflowerblue;"></i>'
      ].join('')
    }
    return data
  }

  static renderLongString(length) {
    return function(data, type, row, meta) {
      if (type === 'display') {
        if (!data) {
          return ''
        } else if (data.length > length) {
          return data.substring(0, length) + '...'
        }
      }
      return data
    }
  }

  constructor({ tableId, reloadFn, resetFn }) {
    this.latestUpdate = Date.now()
    this.latestLink = 0

    const dataTableOptions = {
      autoWidth: true,
      stateSave: true,
      dom: 'RBlftipr',
      buttons: {
        buttons: [
          { extend: 'copy', name: 'copy', text: 'copy to clipboard', enabled: false },
          { extend: 'csv', name: 'csv', text: 'csv', enabled: false },
          { extends: 'excel', name: 'excel', text: 'excel', enabled: false },
          { extends: 'pdf', name: 'pdf', text: 'pdf', enabled: false },
          { extends: 'colvis', name: 'colvis', text: 'columns', enabled: false },
          { name: 'scrape', text: 'scrape more', action: reloadFn, enabled: true },

          { name: 'reset', text: 'reset links table', action: resetFn, enabled: false }
        ]
      },
      data: [],
      // eslint-disable-next-line array-bracket-spacing
      lengthMenu: [ [ 25, 50, 100, -1 ], [ 25, 50, 100, 'All' ] ],
      rowId: 'key',
      responsive: true,
      scrollX: true,
      columns: [
        { title: 'Timestamp', data: 'time', render: TelegramTable.renderTime },
        { title: 'Time', data: 'humanTime' },
        { title: 'Tag', data: 'tag' },
        { title: 'Number', data: 'number' },
        {
          title: 'Chat Name',
          data: 'chatName',
          render: TelegramTable.renderLongString(20)
        },
        {
          title: 'Sender Name',
          data: 'senderName',
          render: TelegramTable.renderLongString(20)
        },
        { title: '', data: 'link', render: TelegramTable.renderLink },
        { title: 'Link', data: 'link' }
      ]
    }

    this.element = document.getElementById(tableId)
    this.dataTable = new DataTable('#' + tableId, dataTableOptions)
    new $.fn.dataTable.ColResize(this.dataTable, {
      isEnabled: true,
      hoverClass: 'dt-colresizable-hover',
      hasBoundCheck: true,
      minBoundClass: 'dt-colresizable-bound-min',
      maxBoundClass: 'dt-colresizable-bound-max',
      saveState: true,
      isResizable: function(column) { 
        return true
      },
      getMinWidthOf(foo) { return 5 },
      onResize: function(column) {
        console.log('...resizing...')
      },
      onResizeEnd: function(column, columns) {
        console.log('I have been resized!')
      }
    })
    
    this.sortByTimeDescending()

    this.dateFormatter = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'long'
    })

    this.dataTable.buttons.exportInfo({
      filename: this.filename.bind(this),
      messageTop: [
        `Current as of ${this.formattedLatestUpdate()};`,
        `most recent link posted at ${this.formattedLatestLink()}.`
      ].join('\n')
    })
  }

  formattedLatestLink() {
    return this.dateFormatter.format(this.latestLink * 1000)
  }

  formattedLatestUpdate() {
    return this.dateFormatter.format(this.latestUpdate * 1000)
  }

  filename() {
    return [ 'Zoom links from Telegram', this.formattedLatestUpdate() ].join(' - ')
  }

  get rows() {
    return this._rows || []
  }

  set rows(newRows) {
    this.dataTable.buttons().disable()
    this.dataTable.button('scrape:name').enable()
    const oldRowsByKey = Object.fromEntries(this.rows.map(r => [ r.key, r ]))
    const rowsToAdd = []

    newRows.forEach(newRow => {
      if (oldRowsByKey[newRow.key]) {
        delete oldRowsByKey[newRow.key]
      } else {
        rowsToAdd.push(newRow)
      }
    })

    this.dataTable.rows.add(rowsToAdd)
    const rowSelectorsToDelete = Object.keys(oldRowsByKey).map(k => `#${k}`)
    this.dataTable.rows(rowSelectorsToDelete).remove()
    this._rows = newRows
    this.dataTable.buttons().enable()
    this.dataTable.draw()
  }


  sortByTimeDescending() {
    $('th:contains("Time")').addClass('sorting_desc')
  }

  joinLinkColumnHeadings() {
    $('th').eq(5).remove()
    $('th').last().attr('colspan', 2)
  }

  setTimeMetadata(latestLink, latestUpdate) {
    this.latestLink = latestLink
    this.latestUpdate = latestUpdate
  }
}
class BootstrapProgressBar {
  constructor({ progressBarId }) {
    this.element = document.getElementById(progressBarId)
    this.$element = $(this.element)
    this.element.classList.add('progress')
    this.element.innerHTML =
      '<div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>'
    this.child = this.element.children[0]
  }

  setProgress(percentage) {
    this.child.setAttribute('aria-valuenow', percentage)
    this.child.style = `width: ${percentage}%;`

    if (percentage < 99) {
      this.show()
    }

    if (percentage > 99) {
      setTimeout(() => {
        this.hide()
      }, 5000)
    }
  }

  reset() {
    this.setProgress(0)
  }

  show() {
    this.$element.show()
  }

  hide() {
    this.$element.hide()
  }
}
