# FAQ

## Why aren't my rules getting applied?

1. Try focusing the editor that you want to highlight.
2. Ensure that the toggle is on (slides to right with green).
3. Check the included files and excluded files. They are strict regex, not comma separated values.

## Why is the border / outline property not being applied/invalid?

Both the border and outline properties can be either the line type (solid/dashed/etc) or the entire property (solid 1px blue). Try not to combine using the other properties for border/outline if putting all attributes in the main input.

**TL;DR: either use outline alone or outline/color/width.**

## Why doesn't my rule preview have the border / outline showing?

To have the preview display properly, please distribute the outline and border properly across the 3 properties.  
For example,

| Decoration (same applies for border) | Expected Value           | Example |
| ------------------------------------ | ------------------------ | ------- |
| outline / border                     | \<outline/border style\> | solid   |
| outline / border color               | \<outline color\>        | blue    |
| outline / border width               | \<outline width\>        | 2px     |

---
