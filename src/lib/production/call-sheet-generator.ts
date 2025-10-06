// Production Call Sheet & Shooting Schedule Generator
// Professional film production documents

export interface ScriptScene {
  sceneNumber: string
  heading: string
  pageCount: number
  content: string
  dayNight: 'DAY' | 'NIGHT' | 'DUSK' | 'DAWN'
  intExt: 'INT' | 'EXT' | 'INT/EXT'
  location: string
  characters: string[]
  props: string[]
  specialRequirements: string[]
}

export interface CallSheet {
  productionTitle: string
  shootDate: string
  callTime: string
  crewCall: string
  director: string
  producer: string
  productionCompany: string

  scenes: Array<{
    sceneNumber: string
    description: string
    pageCount: number
    location: string
    cast: string[]
    estimatedTime: string
  }>

  cast: Array<{
    characterName: string
    actorName: string
    pickupTime: string
    makeupTime: string
    readyTime: string
  }>

  crew: Array<{
    department: string
    role: string
    name: string
    callTime: string
  }>

  locations: Array<{
    name: string
    address: string
    parkingInfo: string
    nearestHospital: string
  }>

  equipment: string[]
  vehicles: string[]
  weatherBackup: string
  notes: string[]
}

export interface ShootingSchedule {
  productionTitle: string
  totalShootDays: number

  days: Array<{
    dayNumber: number
    date: string
    scenes: Array<{
      sceneNumber: string
      pageCount: number
      description: string
      cast: string[]
      location: string
    }>
    totalPages: number
    primaryLocation: string
  }>

  stripBoard: Array<{
    sceneNumber: string
    color: 'white' | 'yellow' | 'green' | 'blue' | 'pink'
    intExt: string
    dayNight: string
    location: string
    pageCount: number
    characters: string[]
  }>
}

export class ProductionDocumentGenerator {
  static parseScriptForProduction(scriptContent: string): ScriptScene[] {
    const lines = scriptContent.split('\n')
    const scenes: ScriptScene[] = []

    let currentScene: Partial<ScriptScene> | null = null
    let sceneContent: string[] = []
    let currentCharacters = new Set<string>()

    for (const line of lines) {
      const trimmed = line.trim()

      // Scene Heading
      if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(trimmed)) {
        // Save previous scene
        if (currentScene) {
          currentScene.content = sceneContent.join('\n')
          currentScene.characters = Array.from(currentCharacters)
          currentScene.pageCount = sceneContent.length / 55 // Rough estimate
          scenes.push(currentScene as ScriptScene)
        }

        // Parse new scene
        const sceneMatch = trimmed.match(/#(\d+[A-Z]?)#/)
        const sceneNumber = sceneMatch ? sceneMatch[1] : String(scenes.length + 1)

        const intExtMatch = trimmed.match(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/)
        const intExt = intExtMatch
          ? (intExtMatch[1].replace('.', '').replace('/', '/') as any)
          : 'INT'

        const dayNightMatch = trimmed.match(/(DAY|NIGHT|DUSK|DAWN|MORNING|EVENING)/)
        const dayNight = dayNightMatch ? (dayNightMatch[1] as any) : 'DAY'

        const location = trimmed
          .replace(/#\d+[A-Z]?#/g, '')
          .replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)\s*/, '')
          .replace(/\s*-\s*(DAY|NIGHT|DUSK|DAWN|MORNING|EVENING).*$/, '')
          .trim()

        currentScene = {
          sceneNumber,
          heading: trimmed,
          intExt,
          dayNight,
          location,
          props: [],
          specialRequirements: [],
        }
        sceneContent = [trimmed]
        currentCharacters = new Set()
      }
      // Character names
      else if (/^[A-Z\s\(\)]+$/.test(trimmed) && trimmed.length < 40 && currentScene) {
        const characterName = trimmed.replace(/\(.*\)/, '').trim()
        currentCharacters.add(characterName)
        sceneContent.push(line)
      }
      // All other lines
      else if (currentScene) {
        sceneContent.push(line)
      }
    }

    // Save last scene
    if (currentScene) {
      currentScene.content = sceneContent.join('\n')
      currentScene.characters = Array.from(currentCharacters)
      currentScene.pageCount = sceneContent.length / 55
      scenes.push(currentScene as ScriptScene)
    }

    return scenes
  }

  static generateCallSheet(
    scenes: ScriptScene[],
    shootDate: string,
    productionInfo: Partial<CallSheet>
  ): CallSheet {
    // Extract unique cast from scenes
    const castSet = new Set<string>()
    scenes.forEach(scene => scene.characters.forEach(c => castSet.add(c)))

    const cast = Array.from(castSet).map(characterName => ({
      characterName,
      actorName: 'TBD',
      pickupTime: '06:00 AM',
      makeupTime: '06:30 AM',
      readyTime: '07:30 AM',
    }))

    return {
      productionTitle: productionInfo.productionTitle || 'Untitled Production',
      shootDate,
      callTime: '07:00 AM',
      crewCall: '06:00 AM',
      director: productionInfo.director || 'TBD',
      producer: productionInfo.producer || 'TBD',
      productionCompany: productionInfo.productionCompany || 'TBD',

      scenes: scenes.map(scene => ({
        sceneNumber: scene.sceneNumber,
        description: scene.heading,
        pageCount: parseFloat(scene.pageCount.toFixed(2)),
        location: scene.location,
        cast: scene.characters,
        estimatedTime: this.estimateSceneTime(scene.pageCount),
      })),

      cast,

      crew: [
        {
          department: 'Camera',
          role: 'Director of Photography',
          name: 'TBD',
          callTime: '06:00 AM',
        },
        { department: 'Sound', role: 'Sound Mixer', name: 'TBD', callTime: '06:30 AM' },
        { department: 'Grip & Electric', role: 'Key Grip', name: 'TBD', callTime: '06:00 AM' },
        { department: 'Art', role: 'Production Designer', name: 'TBD', callTime: '05:00 AM' },
      ],

      locations: scenes.map(scene => ({
        name: scene.location,
        address: 'TBD',
        parkingInfo: 'TBD',
        nearestHospital: 'TBD',
      })),

      equipment: ['Camera Package', 'Lighting Package', 'Sound Package', 'Grip Equipment'],
      vehicles: ['Production Van', 'Equipment Truck'],
      weatherBackup: 'Cover Set: INT. OFFICE',
      notes: [
        'All crew must arrive 15 minutes before call time',
        'Breakfast will be served at 6:30 AM',
        'Lunch break at 12:30 PM',
      ],
    }
  }

  static generateShootingSchedule(scenes: ScriptScene[], totalShootDays: number): ShootingSchedule {
    // Sort scenes by location and day/night for efficient shooting
    const sortedScenes = [...scenes].sort((a, b) => {
      if (a.location !== b.location) return a.location.localeCompare(b.location)
      if (a.dayNight !== b.dayNight) return a.dayNight.localeCompare(b.dayNight)
      return 0
    })

    const totalPages = scenes.reduce((sum, s) => sum + s.pageCount, 0)
    const pagesPerDay = totalPages / totalShootDays

    const days: ShootingSchedule['days'] = []
    let currentDay: ShootingSchedule['days'][0] = {
      dayNumber: 1,
      date: new Date().toISOString().split('T')[0],
      scenes: [],
      totalPages: 0,
      primaryLocation: '',
    }

    for (const scene of sortedScenes) {
      if (currentDay.totalPages + scene.pageCount > pagesPerDay && currentDay.scenes.length > 0) {
        days.push(currentDay)
        currentDay = {
          dayNumber: days.length + 1,
          date: new Date(Date.now() + days.length * 86400000).toISOString().split('T')[0],
          scenes: [],
          totalPages: 0,
          primaryLocation: '',
        }
      }

      currentDay.scenes.push({
        sceneNumber: scene.sceneNumber,
        pageCount: scene.pageCount,
        description: scene.heading,
        cast: scene.characters,
        location: scene.location,
      })
      currentDay.totalPages += scene.pageCount
      if (!currentDay.primaryLocation) currentDay.primaryLocation = scene.location
    }

    if (currentDay.scenes.length > 0) days.push(currentDay)

    // Create strip board
    const stripBoard = sortedScenes.map(scene => ({
      sceneNumber: scene.sceneNumber,
      color: this.getStripColor(scene.intExt, scene.dayNight),
      intExt: scene.intExt,
      dayNight: scene.dayNight,
      location: scene.location,
      pageCount: scene.pageCount,
      characters: scene.characters,
    }))

    return {
      productionTitle: 'Untitled Production',
      totalShootDays: days.length,
      days,
      stripBoard,
    }
  }

  private static estimateSceneTime(pageCount: number): string {
    // Rule of thumb: 1 page = 10-15 minutes shooting time
    const minutes = Math.ceil(pageCount * 12)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  private static getStripColor(
    intExt: string,
    dayNight: string
  ): 'white' | 'yellow' | 'green' | 'blue' | 'pink' {
    // Standard strip board colors
    if (intExt === 'INT' && dayNight === 'DAY') return 'white'
    if (intExt === 'EXT' && dayNight === 'DAY') return 'yellow'
    if (intExt === 'INT' && dayNight === 'NIGHT') return 'blue'
    if (intExt === 'EXT' && dayNight === 'NIGHT') return 'green'
    return 'pink' // INT/EXT or special
  }

  static exportCallSheetToHTML(callSheet: CallSheet): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Call Sheet - ${callSheet.productionTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; }
    .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background: #000; color: #fff; }
    .section-title { background: #f0f0f0; font-weight: bold; margin-top: 20px; padding: 10px; }
  </style>
</head>
<body>
  <h1>CALL SHEET</h1>
  <div class="header-info">
    <div>
      <strong>Production:</strong> ${callSheet.productionTitle}<br>
      <strong>Director:</strong> ${callSheet.director}<br>
      <strong>Producer:</strong> ${callSheet.producer}
    </div>
    <div>
      <strong>Shoot Date:</strong> ${callSheet.shootDate}<br>
      <strong>Crew Call:</strong> ${callSheet.crewCall}<br>
      <strong>General Call:</strong> ${callSheet.callTime}
    </div>
  </div>

  <div class="section-title">SCENES TO BE SHOT</div>
  <table>
    <tr>
      <th>Scene #</th>
      <th>Description</th>
      <th>Pages</th>
      <th>Location</th>
      <th>Cast</th>
      <th>Est. Time</th>
    </tr>
    ${callSheet.scenes
      .map(
        scene => `
    <tr>
      <td>${scene.sceneNumber}</td>
      <td>${scene.description}</td>
      <td>${scene.pageCount}</td>
      <td>${scene.location}</td>
      <td>${scene.cast.join(', ')}</td>
      <td>${scene.estimatedTime}</td>
    </tr>
    `
      )
      .join('')}
  </table>

  <div class="section-title">CAST</div>
  <table>
    <tr>
      <th>Character</th>
      <th>Actor</th>
      <th>Pickup</th>
      <th>Makeup</th>
      <th>Ready</th>
    </tr>
    ${callSheet.cast
      .map(
        c => `
    <tr>
      <td>${c.characterName}</td>
      <td>${c.actorName}</td>
      <td>${c.pickupTime}</td>
      <td>${c.makeupTime}</td>
      <td>${c.readyTime}</td>
    </tr>
    `
      )
      .join('')}
  </table>

  <div class="section-title">CREW</div>
  <table>
    <tr>
      <th>Department</th>
      <th>Role</th>
      <th>Name</th>
      <th>Call Time</th>
    </tr>
    ${callSheet.crew
      .map(
        c => `
    <tr>
      <td>${c.department}</td>
      <td>${c.role}</td>
      <td>${c.name}</td>
      <td>${c.callTime}</td>
    </tr>
    `
      )
      .join('')}
  </table>

  <div class="section-title">IMPORTANT NOTES</div>
  <ul>
    ${callSheet.notes.map(note => `<li>${note}</li>`).join('')}
  </ul>
</body>
</html>`
  }
}
