# Task 4 binding controller amendment

The approved spec requires sizes derived from actual CSS without redesign. The plan formula for featured gallery below768px was inaccurate. For BOTH gallery-featured-lead and gallery-featured-item below768px, use normal gallery auto-fit sizes bounded by total rendered itemCount (including the first item), with the same 39.130435rem threshold for two columns. At >=768px only, lead uses full W and other items use (W - 2rem)/2. Preserve current CSS.

Test375/640/768/1440 plus neighbors around626.08696px and768px (default16px root), one/two/three/four-item layouts. Above768px featured explicit two-column geometry does not depend on normal auto-fit thresholds. Carry640px into Task6 browser acceptance. Full explanation/cost recorded as Ruling in progress.md.
