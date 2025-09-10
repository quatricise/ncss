

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



type NCSSStyle = Partial<CSSStyleDeclaration> & Iterable<[keyof CSSStyleDeclaration, string | null | undefined]>

type NCSSQuery = 
  | { type: "string"; value: string}
  | { type: "array";  value: string[]};

interface NCSSAction {
  query: NCSSQuery, 
  style: NCSSStyle
};

interface NCSSId {
  id: number
  name: string // I think this is the query you input into NCSS(), but I don't know yet. NCSS is only a styling engine, it does not touch markup other than by adding style info.
}

const NCSSActions: NCSSAction[] = []; // series of actions that are then executed once the list is complete

// I think elements tracked internally by NCSS should have numerical ids so string parsing doesn't have to be done.
// This is an array and not Set, because I want to throw when you try to add the same id again. Set<> would just quietly swallow the mistake.
const NCSSIds: NCSSId[] = []

function NCSSRegisterElement(name: string) {
  assert(NCSSIds.find(id => id.name === name) !== undefined, "Name already exists")

  const random = Math.round(Math.random() * 1_000_000_000_000) // @todo replace generator for something sophisticated
  NCSSIds.push({id: random, name: name})
};



// 07-09-2025:
// I think this should not have any compound properties, it would be a nightmare having to deal with those and how it interacts with my code

// also: the user can customize this function to contain any default styles, but it should be communicated this is expected from NCSS and changing it could make it difficult for others to deal with their code
// also 2: I could make the compound properties (padding or border) forbidden in NCSS, which could annoy people but they'd get used to it. It's just a little bit of extra typing.
function NCSSApplyBase(element: HTMLElement) {
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

function NCSSAddStylingFunction(query: NCSSQuery, style: NCSSStyle) {
  NCSSActions.push({query, style})
}

// formerly NCSSApplyStyle() but I think it should be shorter like this
function NCSS(query: NCSSQuery, style: NCSSStyle) {
  const queries: string[] = []

  switch(query.type) {
    case "string": {
      queries.push(query.value)
      break
    }
    case "array": {
      queries.push(...query.value)
      break
    }
    default: {
      throw new Error("Missing case for type: " + query.type)
    }
  }

	queries.forEach(query => {
    for(const key in style) {
      NCSSRegisterElement(query)
    }
  })
}

// runs the styling function
function NCSSRun() {
  const sheet = new CSSStyleSheet()

  NCSSActions.forEach(action => {
    const layerName = action.query
    const elementName = action.query
    let styleString: string = ""

    for(const key of action.style) {
      styleString += `${key}: ${action.style[key]}; \n`
    }

    sheet.insertRule(`
      @layer ${layerName} {
        #${elementName} {
          ${styleString}
        }
      }
    `)
  })
}

function test1() {

}

// The output goal is currently: JS objects that contain style info. Perhaps a "Map<(html element id), NCSSStyle>"

// Random note but kinda important: should this project not actually output raw CSS? using a different system than stupid BEM, but something that is trackable back but
// remains CSS because I don't want to run a shit-ton of javascript to actually style a website, even if a shit-ton already runs in other libraries, so maybe fuck it
// I can try to rely on this javascript system for a while unless it proves to be unreadable.