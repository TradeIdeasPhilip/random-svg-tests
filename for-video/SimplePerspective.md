So you want to add a little 3d to your program, and you're looking for something simple.

Here's a __really__ _easy_ formula for 3d perspective.
This example is in TypeScript but the formula will work anywhere.

Here's the heart of the formula: `ratio = perspective / (perspective + z)`.

Imagine your computer screen is a window, and there's a whole 3d world hiding behind it.
Your job is to draw on the screen so you will see exactly what the window would have shown you.
To do this you need to know where each object is in relation to the screen.
And you need to know where the viewer is in relation to the screen.

`z` says how far an object is behind the screen.
`perspective` says how far the viewer is from the screen.
`perspective + z` says approximately how the viewer is from an object.


`ratio` says how to alter the size of the object to make it look right.
Here's how I adjust my spheres to take the distance into account:
`const radius = baseRadius * flattener.ratio;`

As an object goes further into the distance `ratio` will get closer to zero and the object will appear really small.
If `z` ≫ `perspective` then the object is far away.

If an object's `z` = 0 then the object is right at the screen.
In that case `ratio` will be 1.

I'm using 1 for my default `perspective`.
As the `perspective` gets closer to 0 the difference between the near and far objects gets more obvious.
As the `perspective` grows without bound, the near and far objects look more similar.
I usually tweak the number by hand until the result looks good.

`z` should not be negative.
That would mean that the object is on the user's side of the monitor!
`perspective` should not be negative.
That would mean that the user on the wrong side of the monitor.

Where is the "vanishing point"?
It's not enough to make the objects smaller.
As the objects move far away in 3d space, they need to move closer to the vanishing point in 2d space.
If the center of the screen was at x=0, y=0, then you could just multiply both numbers by the `ratio`.
I wanted the center to be at x=0.5, x=0.5.
I used linear interpolation because `phil-lib` makes that easy.
I handled x and y separately, each with the exact same algorithm.
I said anything that was in the middle (0.5) to begin with would stay at that point.
And whatever the distance was between the middle and the actual point, I multiplied that by the `ratio`.

If you were already using matrices or css transforms, those offer a simple way to move the center.
But if you're not working with that framework, it's easy enough to do that by hand.
In retrospect, I should have made the middle of the screen (0,0), to make the math easier.