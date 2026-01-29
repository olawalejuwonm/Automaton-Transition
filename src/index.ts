// This module implements a Boolean automaton generator based on user-defined transition relations in propositional logic.
import * as fs from 'fs';
import * as path from 'path';
/**
 * Boolean Automaton Generator
 * Based on user-defined transition relations in propositional logic.
*/
// Core generator implementation
/**
 * Read and parse transition relations from file.
 * @param filePath Path to the transitions definition file.
 * @returns Map from variable name to its transition expression.
 */
function parseTransitions(filePath: string): Map<string,string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const transitions = new Map<string,string>();
  content.split(/\r?\n/).forEach((line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parts = trimmed.split(/≡|=/);
    if (parts.length < 2) {
      throw new Error(`Invalid transition line: ${line}`);
    }
    const lhs = parts[0].replace(/['’′`]/g,'').trim();
    const rhs = parts.slice(1).join('=').trim();
    transitions.set(lhs, rhs);
  });
  return transitions;
}

/**
 * Perform topological sort of variables based on dependencies on primed variables.
 */
function topoSort(vars: string[], deps: Map<string,string[]>): string[] {
  const inDegree = new Map<string,number>();
  const adj = new Map<string,string[]>();
  vars.forEach(v => { inDegree.set(v, 0); adj.set(v, []); });
  deps.forEach((dl, v) => {
    dl.forEach(d => {
      inDegree.set(v, (inDegree.get(v) || 0) + 1);
      adj.get(d)!.push(v);
    });
  });
  const queue = vars.filter(v => inDegree.get(v) === 0);
  const order: string[] = [];
  while (queue.length) {
    const v = queue.shift()!;
    order.push(v);
    adj.get(v)!.forEach(n => {
      inDegree.set(n, inDegree.get(n)! - 1);
      if (inDegree.get(n) === 0) queue.push(n);
    });
  }
  if (order.length !== vars.length) {
    throw new Error('Cycle detected in transition dependencies');
  }
  return order;
}

/**
 * Generate all binary combinations for given length.
 */
function* genCombos(n: number): IterableIterator<number[]> {
  const total = 1 << n;
  for (let i = 0; i < total; i++) {
    const combo: number[] = [];
    for (let j = n - 1; j >= 0; j--) {
      combo.push((i >> j) & 1);
    }
    yield combo;
  }
}

/**
 * Main execution entry point.
 */
function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node dist/index.js <transitions file>');
    process.exit(1);
  }
  const filePath = path.resolve(process.cwd(), args[0]);
  const transitions = parseTransitions(filePath);
  const vars = Array.from(transitions.keys()).sort();
  const deps = new Map<string,string[]>();
  const varSet = new Set(vars);
  const allRefs = new Set<string>();
  transitions.forEach((expr, v) => {
    const primed = Array.from(expr.matchAll(/\b([A-Za-z]\w*)['’′`]/g))
                      .map(m => m[1])
                      .filter(d => varSet.has(d));
    deps.set(v, primed);
    for (const m of expr.matchAll(/\b([A-Za-z]\w*)\b/g)) {
      allRefs.add(m[1]);
    }
  });
  const inputs = Array.from(allRefs).filter(x => !varSet.has(x)).sort();
  const updateOrder = topoSort(vars, deps);
  
  // Helper function to format variables with values
  function formatVars(varNames: string[], values: Record<string,boolean>): string {
    return varNames.map(v => `${v}: ${values[v] ? '1' : '0'}`).join(', ');
  }
  
  let lineNumber = 1;
  console.log(['#', 'State','Input','Next'].join('\t'));
  for (const stateBits of genCombos(vars.length)) {
    const curr: Record<string,boolean> = {} as any;
    vars.forEach((v,i) => curr[v] = Boolean(stateBits[i]));
    for (const inpBits of genCombos(inputs.length)) {
      const inp: Record<string,boolean> = {} as any;
      inputs.forEach((u,i) => inp[u] = Boolean(inpBits[i]));
      const next: Record<string,boolean> = {} as any;
      updateOrder.forEach(v => {
        let expr = transitions.get(v)!;
        expr = expr.replace(/¬/g,'!')
                   .replace(/∧/g,'&&')
                   .replace(/∨/g,'||')
                   .replace(/⊕/g,'!=');
        // Replace primed variable references first, matching variable followed by apostrophe
        varSet.forEach(d => {
          expr = expr.replace(new RegExp("\\b" + d + "(?:['’′`])", 'g'), "next." + d);
        });
        // Replace current state variable references (unprimed)
        varSet.forEach(d => {
          // Only replace standalone vars, not those in next.<var>
          expr = expr.replace(new RegExp("(?<!\\.)\\b" + d + "\\b", 'g'), "curr." + d);
        });
         // Replace input variable references
         inputs.forEach(u => {
           expr = expr.replace(new RegExp("\\b" + u + "\\b", 'g'), "inp." + u);
         });
        // Remove any accidental nested next.curr. references
        expr = expr.replace(/next\.curr\./g, 'next.');
        // Evaluate the boolean expression
        next[v] = Boolean((Function('curr','inp','next', 'return (' + expr + ');'))(curr, inp, next));
      });
      console.log([
        lineNumber++,
        formatVars(vars, curr),
        formatVars(inputs, inp),
        formatVars(vars, next)
      ].join('\t'));
    }
  }
}

main();
