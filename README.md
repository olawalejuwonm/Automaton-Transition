# Automaton Transition Generator

This project generates a simple boolean automaton based on user-defined transition relations.

## Getting Started

Install dependencies:

```powershell
npm install
```  

Compile the project:

```powershell
npm run build
```  

Run the generator:

```powershell
npm start -- <transitions file>
npm start -- transitions.txt
```
Example transitions file format:

```
x’ ≡ ¬ x ∧ y
y’ ≡ b ∧ y
z’ ≡ a ⊕ y
```

## Requirements

- Node.js 14+
- TypeScript


# Example
x’ ≡ ¬ x ∧ y
y’ ≡ b ∧ y
z’ ≡ a ⊕ y


State   Input   Next
000     00      000
000     01      000
000     10      001
000     11      001
001     00      000
001     01      000
001     10      001
001     11      001
010     00      101
010     01      111
010     10      100
010     11      110
011     00      101
011     01      111
011     10      100
011     11      110
100     00      000
100     01      000
100     10      001
100     11      001
101     00      000
101     01      000
101     10      001
101     11      001
110     00      001
110     01      011
110     10      000
110     11      010
111     00      001
111     01      011
111     10      000
111     11      010