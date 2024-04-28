# Random SVG Tests

I'm having fun.
It's nice to have a place to doodle.
See it running at https://tradeideasphilip.github.io/random-svg-tests/.

## Quick Simple Fun JavaScript Animations

This video will show you my initial progress:

[![Quick Simple Fun JavaScript Animations](for-readme/Quick%20Simple%20Fun%20JavaScript%20Animations.png)](https://www.youtube.com/watch?v=PW7AGXQocTU)

Since then I've added a [simple physics engine](https://github.com/TradeIdeasPhilip/random-svg-tests/commit/7edfc00b4d33ed860063ceae97172ab9438529f1).
The physics works, but my [first attempt at goal seeking](https://github.com/TradeIdeasPhilip/random-svg-tests/blob/7edfc00b4d33ed860063ceae97172ab9438529f1/src/main.ts#L677) is better at orbiting a goal than actually touching it.

## Perspective

![The result of calling ThreeDFlattener.tunnelDemo().](./for-readme/tunnel-with-bad-z.png)
In the picture above all of the balls should be the same size, and the spaces between them should also be the same size.
However, as the balls in the distance shrink to show perspective, the spaces between them grow.
I need to do a better job flattening the positions from 3d to 2d.
I suspected my approximations are off, and this demo proves it.

The picture above is from [this commit](https://github.com/TradeIdeasPhilip/random-svg-tests/commit/af89f2479489cfdc187fe0e05395e0b683740547) but the problem goes back much further.

![ThreeDFlattener.tunnelDemo() after the fix.](./for-readme/tunnel-fixed.png)
This shows what the same demo looks like after my fix.
Now there is very little space visible between the first and second row.
And there is no space between the following rows.
(The first row is the row closest to the user's face.)
It looks like a tightly wound spring.
In the previous picture it looks like a spring that's been stretched out.
The further the spring is from the user, the more stretched it is.

My fix was based on actual math.
My first version was a quick guess.
So I'm confident in my fix.

## Colophon

This project was created from a template at https://github.com/TradeIdeasPhilip/typescript-template/.

See https://tradeideasphilip.github.io/typescript-getting-started/#degit_template__Try_It for instructions on using this template, along with background information on this template and the tools it uses.
