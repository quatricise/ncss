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

interface NCSSAction {
  id: number,
  name: string, // I think this is the query you input into NCSS(), but I don't know yet. NCSS is only a styling engine, it does not touch markup other than by adding style info.
  style: NCSSStyle,
};


const NCSSFlags = {
  beganStyling: false,
  endedStyling: false,
}

const NCSSActions: NCSSAction[] = []; // series of actions that are then executed once the list is complete
let NCSSNextActionIndex: number = 0
// I think elements tracked internally by NCSS should have numerical ids so string parsing doesn't have to be done.
// This is an array and not Set, because I want to throw when you try to add the same id again. Set<> would just quietly swallow the mistake.

function NCSSRegisterAction(name: string, style: NCSSStyle) {
  assert(NCSSActions.find(action => action.name === name) === undefined, "Name already exists: " + name)
  assert(document.querySelector("#" + name) != null, `$h found not element with id: #${name}`)

  const random = NCSSNextActionIndex + 1 // @todo replace generator for something sophisticated
  NCSSActions.push({id: random, name: name, style: style})
};



// 07-09-2025:
// I think this should not have any compound properties, it would be a nightmare having to deal with those and how it interacts with my code

// also: the user can customize this function to contain any default styles, but it should be communicated this is expected from NCSS and changing it could make it difficult for others to deal with their code
// also 2: I could make the compound properties (padding or border) forbidden in NCSS, which could annoy people but they'd get used to it. It's just a little bit of extra typing.
function NCSSApplyBase(element: HTMLElement) {

  //this is not how it's done, it will drop these first into each LAYER-ELEMENT-THINGY and then potentially replace these base ones by the new ones supplied
  const s = element.style 

  // try to make these groups go alphabetically, such as "font(F)amily, font(S)ize, font(W)eight"

  s.backgroundColor = "white";
  s.color = "black";

  s.paddingTop =      "0";
  s.paddingBottom =   "0";
  s.paddingLeft =     "0";
  s.paddingRight =    "0";

  s.marginTop =       "0";
  s.marginBottom =    "0";
  s.marginLeft =      "0";
  s.marginRight =     "0";

  s.borderTop =       "0";
  s.borderBottom =    "0";
  s.borderLeft =      "0";
  s.borderRight =     "0";

  s.fontFamily =      "serif";
  s.fontSize =        "1rem";
  s.fontStyle =       "normal";
  s.fontWeight =      "400";

  s.display =         "initial";
  s.alignItems =      "flex-start";
  s.justifyContent =  "flex-start";

  s.position =        "static";
  s.top =             "0";
  s.bottom =          "0";
  s.right =           "0";
  s.left =            "0";
}

function NCSS(queries: string[], style: NCSSStyle) {
  assert(NCSSFlags.beganStyling && !NCSSFlags.endedStyling, "NCSS: Forgot to call 'NCSSBegin()'.")
  assert(Object.keys(style).length !== 0, "NCSS: No empty styles allowed.")
	queries.forEach(query => {
    NCSSRegisterAction(query, style)
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
function NCSSBuild() {
  NCSSCheckHTML()
  NCSSFlags.endedStyling = true
  console.log(NCSSActions)
  const stylesheet = new CSSStyleSheet()

  const layerRule = `@layer ${NCSSActions.map(a => a.name).join(", ")};`
  stylesheet.insertRule(layerRule)
  console.log(layerRule)

  NCSSActions.forEach(action => {
    const layerName = action.name
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

export function NCSSTest1() {
  NCSSBegin()
  NCSS(["section-hero"], {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "blue",
    height: "100px",
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
  NCSS(["main"], {
    color: "green",
  })
  NCSSBuild()
}