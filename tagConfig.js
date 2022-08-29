  const TagConfig = {
    keep: [ 'zoom.us', 'ringcentral', 'gheers' ],
    tags: {
      two_twelve: { name: 'The 212', rooms: [ 2125555212 ] },
      prime: { name: 'Prime Lounge', rooms: [ 2225005222 ] },
      elite: { name: 'Elite Lounge', rooms: [ 2229009222 ] },
      wolfys: {
        name: "Wolfy's Den",
        rooms: [ 3046973237 ],
        gheers: [ 'wolfys', 'wolfysden' ]
      },
      jockcentral: { rooms: [ 3056666305 ] },
      adam_solinho: { rooms: [ 3057777503 ] },
      daddy_socal: { name: "Daddy's Socal", rooms: [ 3230000323 ] },
      monarque: { rooms: [ 3336963333 ] },
      high_pig_1: { rooms: [ 4202731747 ] },
      capt_jack: { rooms: [ 4208008609 ] },
      pole_smoker: { rooms: [ 4564534687 ] },
      high_pig_2: { rooms: [ 4725507990 ] },
      chi_pig: { rooms: [ 5015904254 ] },
      starlight: { rooms: [ 5031701503 ] },
      strippy: { rooms: [ 5412541254 ] },
      london_higher: { rooms: [ 5663664297 ] },
      hades_hellfire: { rooms: [ 6025205204 ] },
      jspun: { rooms: [ 7027022021 ] },
      pup_zeke: { rooms: [ 7040704070 ] },
      zoom_7: { rooms: [ 7771427777 ] },
      twack_city: { rooms: [ 8116816816 ] },
      ps_the_53: { rooms: [ 8183100760 ] },
      the_819: { rooms: [ 8198198119 ] },
      reunion_zoom: { rooms: [ 84260186647 ] },
      bet_bet: { rooms: [ 85179635739 ] },
      svarion: { rooms: [ 8611001234 ] },
      bigmuscle: {
        name: 'Where Big Muscle Meets Big Cock',
        rooms: [ 87137820183 ]
      },
      kitty_meow: { rooms: [ 89201299326 ] },
      gex_xxx: { rooms: [ 9196666919        ] },
      fired_up: { rooms: [ 9450000945 ] }
    },
    canonicalGheers: {},
    tagsByRoom: {}
  }

  const tagsByRoom = {}

  Object.entries(TagConfig.tags).forEach(([ tag, config ]) => {
    config.rooms.forEach(room => {
      if (tagsByRoom[room]) {
        console.warn(`duplicate tag for room ${room}, replacing ${tagsByRoom[room]} with ${tag}`)
      }
      tagsByRoom[room] = tag
    })
  })

  TagConfig.tagsByRoom = tagsByRoom
