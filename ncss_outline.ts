
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






type NCSSQuery = 
  | { type: "string"; value: string}
  | { type: "array";  value: string[]};

interface NCSSAction {
  query: NCSSQuery, 
  style: Partial<CSSStyleDeclaration>
};

const NCSSActions: NCSSAction[] = [];

function NCSSRegisterElementId(id: string) {
  
};

// important: 
// 07-09-2025: 
// I think this should not have any compound properties, it would be a nightmare having to deal with those and how it interacts with my code
// also: the user can customize this to be anything, but it should be communicated this is expected from NCSS and changing it could make it difficult for others to deal with their code
function NCSSApplyZero(element: HTMLElement) {
  element.style.backgroundColor = "white";
  element.style.color = "black";

  element.style.paddingTop =    "0";
  element.style.paddingBottom = "0";
  element.style.paddingRight =  "0";
  element.style.paddingLeft =   "0";

  element.style.marginTop =     "0";
  element.style.marginBottom =  "0";
  element.style.marginRight =   "0";
  element.style.marginLeft =    "0";

  element.style.borderTop =     "0";
  element.style.borderBottom =  "0";
  element.style.borderRight =   "0";
  element.style.borderLeft =    "0";

  element.style.fontFamily = "serif";
  element.style.display = "initial";
  element.style.position = "static";
}

function NCSSAddStylingFunction(query: NCSSQuery, style: Partial<CSSStyleDeclaration>) {
  NCSSActions.push({query, style})
}

function NCSSApply(query: NCSSQuery, style: Partial<CSSStyleDeclaration>) {
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
      $h(query).style[key] 
    }
  })
}

function NCSSGenerateStyles(): [string[], string[]] {
  const styles: string[] = []
  const ids: string[] = []

  assert(ids.length === styles.length, "Styles and IDs do not match length.")
  return [ids, styles]
}

// let keys = []
// let values = []
// for(let key in document.body.style) {
//     keys.push(key)
//     values.push(document.body.style[key])
// }
// console.log(keys.join("\n"))
// console.log(values.join("\n"))
