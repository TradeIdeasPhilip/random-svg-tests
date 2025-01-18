# SVG for Programmers

![A test to see if it's working](public/template.svg)

![A test to see if it's working](public/sample-1.svg)

## What I Wish Someone Had Told Me

The first few times I looked at SVG, I was very scared.
And more than a little bit frustrated.

Now that I'm finally comfortable with it, it really isn't that hard.
If you know how to modify the DOM with JavaScript and CSS, you already have a strong foundation.

Allow me to guide you through some of the most essential concepts in SVG.
This is where I got stuck.
There are so many features, and so much documentation, you can get lost.
To paraphrase [Zipf's law](https://en.wikipedia.org/wiki/Zipf%27s_law),
focus on the few most important items, and ignore the rest as long as you can.

And I can show you some pitfalls to avoid.
All the things I wish someone had told me when I first started looking at SVG.

## What is SVG?

SVG is a file format for high quality vector graphics.
It is a popular and well supported format.

The drawing primitives are very similar to those available in the html 5 canvas, and a lot of other graphics interfaces.
(I.e. stroking and filling paths.)
The big difference is that HTML 5 canvas is little more than a bitmap and you say in advance how many pixels to use.
It has almost no other memory.
If you want to modify a single element, or change the resolution, you have to take care of that yourself.
In SVG you build a _document_ out of elements and attributes, just like in HTML.
You can make small or large changes to these objects, and SVG will automatically redraw as necessary.
And you _never_ have to worry about resolution, that's all done for you automatically.

SVG is part of the HTML family.
You can embed an SVG into an HTML document, sharing the same DOM, CSS files, event handlers, screen space, etc.

## Elements

### svg

include the namespace. multiple ways to show off the namespace.
Most features that are available to hmtlelements are also available to svgelements

lots of boilerplate
css for the size, only a suggestion for an svg file
a good place for user variables.
clip:none
show svg on top of other things, but less mouse clicks pass through.

### circle

problem with the r compared to the cx and cy.
One option is to scale things.
Start showing off transform property.

element.setAttribute() vs element.style vs element.?.baseValue.value

### rectangle & transform

top left corner!! Fixable but annoying

A great place to show off the transform property.

### g

used with transforms.
used to make things easier to access from code, e.g. deleting everything in one group when you restart.

### Path

"Low Level" access to a path.

### Use

keep things simple
properties can't be overwritten easily
But blank properties are easy to fill in
I.e. start with the base model, and add things after you use the thing
And the base model is always hidden, so you don't have to configure it more
Makes life easier.

### \<text\>

optical sizing
baseline and centering issues
How do links look on a mac!!!?

svg animations vs css animations vs animation API vs animation class.

line dash array
examples of motion
Split the path at each M to make it look better.
rounded vs not rounded end caps

endcaps and corners
round solves a lot of problems.

create in html and save as it's own document
See public/template.svg

Local \<style\> vs importing.
And check on local JavaScript vs importing.
