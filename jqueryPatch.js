jQuery.event.special.touchstart = {
  setup: function( _, ns, handle ){
    if ( ns.includes("noPreventDefault") ) {
      this.addEventListener("touchstart", handle, { passive: false })
    } else {
      this.addEventListener("touchstart", handle, { passive: true }) 
    } 
  }
}

jQuery.event.special.touchmove = {
  setup: function( _, ns, handle ){
    if ( ns.includes("noPreventDefault") ) {
      this.addEventListener("touchstart", handle, { passive: false })
    } else {
      this.addEventListener("touchstart", handle, { passive: true }) 
    } 
  }
}
``
