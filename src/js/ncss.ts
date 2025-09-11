/** Query the document to get a single element matching the query (standard querySelector) */
function $h(query: string): HTMLElement {
  const element = document.querySelector(query);
  if (!element || element instanceof HTMLElement === false) {
    throw new Error("$h: No HTMLElement found by query: " + query);
	}
  return element as HTMLElement;
}

/** Query the document to get a single element matching the query (similar to querySelectorAll, but returns an array, instead of Nodelist) */
function $ha(query: string, errorOnMiss: boolean = true): HTMLElement[] {
  const elements = Array.from(document.querySelectorAll(query));

  if (!elements || elements.length === 0) {
    if (errorOnMiss) {
      console.error("$ha: Error", elements)
      throw new Error("$ha: No HTMLElements found by query: ${query}. \n Maybe you wanted to look for MathMLElement or SVGElement? If so, use $m/$ma or $s/$sa functions instead.");
    } 
    else {
      return [];
    }
  }
    
  if(elements.every((e) => e instanceof HTMLElement) === false) {
    if(errorOnMiss) {
      console.error("$ha: Error", elements)
      throw new Error("$ha: Not every element found is an HTMLElement.")
    } 
    else {
      return []
    }
  }
  return elements;
}

function assert(predicate: boolean, errorMsg: string) {
  if(!predicate) throw new Error(errorMsg)
}

function entries<T>(obj: Partial<T>): [keyof T, T[keyof T] | undefined][] {
  return Object.entries(obj) as [keyof T, T[keyof T] | undefined][]
}

function camelToDashed(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}



type NCSSStyle = Partial<CSSStyleDeclaration>

type NCSSActionType = "ID_RULE" | "ID_SUB_RULE"

interface NCSSAction {
  type: NCSSActionType,

  // currently unused I think
  id: number,

  // I think this is the element id query you input into NCSS(), NCSS throws if there is not element found with that id. 
  // NCSS is only a styling engine, it does not touch markup other than by adding style info.
  name: string,

  style: NCSSStyle,
  layerName: string | null,
};


const NCSSFlags = {
  beganStyling: false,
  endedStyling: false,
}


// I think elements tracked internally by NCSS should have numerical ids so string parsing doesn't have to be done.
// This is an array and not Set, because I want to throw when you try to add the same id again. Set<> would just quietly swallow the mistake.
// 11-09-2025 I do not use the IDs for anything yet. Might actually remove them, who knows.
const NCSSActions: NCSSAction[] = [];
let NCSSNextActionIndex: number = 0

function NCSSRegisterAction(name: string, style: NCSSStyle, layerName: string | null, type: NCSSActionType) {
  assert(NCSSActions.find(action => action.name === name) === undefined, "Name already exists: " + name)
  assert(document.querySelector("#" + name) != null, `$h found not element with id: #${name}`)

  const id = NCSSNextActionIndex
  NCSSNextActionIndex++
  NCSSActions.push({id: id, name: name, style: style, layerName: layerName ?? null, type: type})
};



// 07-09-2025:
// I think this should not have any compound properties, it would be a nightmare having to deal with those and how it interacts with my code

// also: the user can customize this function to contain any default styles, but it should be communicated this is expected from NCSS and changing it could make it difficult for others to deal with their code
// also 2: I could make the compound properties (padding or border) forbidden in NCSS, which could annoy people but they'd get used to it. It's just a little bit of extra typing.
function NCSSApplyBase(element: HTMLElement) {

  //this is not how it's done, it will drop these first into each LAYER-ELEMENT-THINGY and then potentially replace these base ones by the new ones supplied
  const s = element.style 

  // note: try to make these groups go alphabetically, such as "font(F)amily, font(S)ize, font(W)eight", or TOP-RIGHT-BOTTOM-LEFT

  s.backgroundColor = "white";
  s.color =           "black";

  s.paddingTop =      "0";
  s.paddingRight =    "0";
  s.paddingBottom =   "0";
  s.paddingLeft =     "0";

  s.marginTop =       "0";
  s.marginRight =     "0";
  s.marginBottom =    "0";
  s.marginLeft =      "0";

  s.borderTop =       "0";
  s.borderRight =     "0";
  s.borderBottom =    "0";
  s.borderLeft =      "0";

  s.fontFamily =      "serif";
  s.fontSize =        "1rem";
  s.fontStyle =       "normal";
  s.fontWeight =      "400";

  s.display =         "initial";
  s.alignItems =      "flex-start";
  s.justifyContent =  "flex-start";

  s.position =        "static";
  s.top =             "0";
  s.right =           "0";
  s.bottom =          "0";
  s.left =            "0";
}

function NCSS(queries: string[], style: NCSSStyle) {
  assert(NCSSFlags.beganStyling && !NCSSFlags.endedStyling, "NCSS: Forgot to call 'NCSSBegin()'.")
  assert(Object.keys(style).length !== 0, "NCSS: No empty styles allowed.")
	queries.forEach(query => {
    NCSSRegisterAction(query, style, NCSSLayerCurrent, "ID_RULE")
  })
}

function NCSSBegin() {
  NCSSFlags.beganStyling = true
}

/** Runs before generating the stylesheet. Checks for duplicate element ids. */
function NCSSCheckHTML() {
  const elements = $ha("*")
  const ids = new Set<string>()
  const duplicateIds: string[] = []

  elements.forEach(el => {
    const sizeBefore = ids.size
    ids.add(el.id)
    if(el.id && sizeBefore === ids.size) {
      duplicateIds.push(el.id)
    }
  })
  assert(duplicateIds.length === 0, `The HTML markup of the Document contains duplicate IDs, please fix. \n Ids in question: \n ${duplicateIds.map(id => `"${id}"`).join("\n")}`)
}

// runs the styling function
// so far it is quite dumb so it creates a layer block even if a layer is active, but I don't know if that's a problem yet.
function NCSSBuild() {
  assert(NCSSFlags.endedStyling === false, "Already build the stylesheet. Cannot call NCSSBuild() again.")
  NCSSCheckHTML()
  NCSSFlags.endedStyling = true
  console.log(NCSSActions)
  const stylesheet = new CSSStyleSheet()
  const layers: Set<string> = new Set()

  NCSSActions.forEach(action => {
    layers.add(action.layerName ?? action.name)
  })

  console.log(layers)

  const layerRule = `@layer ${Array.from(layers).join(", ")};`
  stylesheet.insertRule(layerRule)
  console.log(layerRule)

  NCSSActions.forEach(action => {
    const layerName = action.layerName ?? action.name
    const elementName = action.name
    let styleString: string = ""

    for(const [key, value] of entries<NCSSStyle>(action.style)) {
      styleString += `${(camelToDashed(String(key)))}: ${action.style[key]}; \n`
    }

    const rule = `
      @layer ${layerName} {
        #${elementName} {
          ${styleString}
        }
      }
    `
    // !important police: this shit will be slow as hell
    assert(rule.includes("!important") === false, `No "!important" rules allowed, it breaks control flow in NCSS.`)

    stylesheet.insertRule(rule)
  })

  document.adoptedStyleSheets.push(stylesheet)
  console.log(stylesheet)
}

const NCSSLayers: string[] = []
let NCSSLayerCurrent: string | null = null

// is missing policing for wrong strings with incorrect characters in them, I should limit to [a-z, 0-9, _-] and that's it??
function NCSSLayerBegin(layerName: string) {
  assert(NCSSLayerCurrent === null, `Forgot to end previous layer: '${NCSSLayerCurrent}'`)
  assert(layerName !== "" && layerName !== null, "Incorrect layer name: Cannot be empty string or null.")
  assert(NCSSLayers.find(l => l === layerName) === undefined, `This layerName already exists: '${layerName}'`)
  assert(layerName.includes(" ") === false, `No whitespace characters allowed in layerName: ${layerName}`)

  NCSSLayerCurrent = layerName
  NCSSLayers.push(layerName)
}

function NCSSLayerEnd(layerName: string) {
  assert(layerName === NCSSLayerCurrent, `Incorrect layer name: ${layerName}. Current layer is: ${NCSSLayerCurrent}`)

  NCSSLayerCurrent = null
}

// this is extremely inefficient code
function NCSSSubRule(idBasedQueries: string[], subordinateQueries: string[], style: NCSSStyle) {
  const missingQueries: string[] = []
  const lengthCheck: Set<string> = new Set()

  idBasedQueries.forEach(query => {
    lengthCheck.add(query)
    const match = NCSSActions.find(action => action.name === query)
    if(!match) {
      missingQueries.push(query)
    }
  })
  
  assert(missingQueries.length === 0, `Not all queries found in NCSSActions[]. These are missing: ${missingQueries.map(q=>`'${q}'`).join(", ")}`)
  assert(idBasedQueries.length === lengthCheck.size, `Duplicate queries.`) //could be more verbose
}

export function NCSSTest1() {
  NCSSBegin()

  NCSSLayerBegin("main")
  NCSS(["main"], {
    color: "green",
  })
  NCSSLayerEnd("main")

  NCSSLayerBegin("section-hero")
  NCSS(["section-hero"], {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "blue",
    height: "100px",
  })

  // now this is my big thing, you can insert any CSS selectors
  // this also uses layers if one is active at the 'global' NCSS level
  // each sub-rule has to be attached to an ID-identified element that has been established previously, and ideally before a new one is established in the chain, yes, for transparency !
  // the subrule now fucks up my single-action type system, so I might have to turn actions into a discrim. union
  NCSSSubRule(["section-hero"], ["svg", "svg.icon"], {
    width: "100%",
    height: "100%",
  })

  NCSS(["section-hero--thingymabob", "section-hero--thingymabob1", "section-hero--thingymabob2"], {
    width: "100px",
    height: "100px",
    borderRadius: "10px",
    backgroundColor: "rgb(230, 0, 0)",
    color: "blue",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  })
  NCSS(["shitty-text"], {
    color: "pink",
  })
  NCSS(["section-detail"], {
    display: "grid",
    gridAutoFlow: "row",
  })
  NCSSLayerEnd("section-hero")

  NCSSBuild()
}