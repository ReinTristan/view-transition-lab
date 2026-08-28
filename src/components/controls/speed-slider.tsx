import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { BASE_DURATION, SPEED_MAX, SPEED_MIN, SPEED_STEP } from '@/themes/store'
import { setSpeed, useSpeed } from '@/themes/use-theme'

/**
 * Slowing the wipe down is what makes a view transition inspectable without
 * fighting the DevTools animation panel.
 */
export function SpeedSlider() {
  const speed = useSpeed()
  const duration = Math.round(BASE_DURATION / speed)

  return (
    // flex-1 is scoped to md: the header is a column below that breakpoint, so
    // there it would grow along the vertical axis and do nothing for the width.
    <div className='flex items-center gap-2 md:flex-1'>
      <Label htmlFor='speed' className='text-muted-foreground text-xs'>
        Speed
      </Label>
      <Slider
        id='speed'
        // A definite width, not the percentage the Slider ships with. Stacked
        // on a phone this box is shrink-to-fit, and a percentage width
        // contributes nothing to a parent sized by its content: the track has
        // no intrinsic width, so the control collapses to the size-3 thumb.
        // 40 matches the engine select, so both controls line up in the stack.
        //
        // The data-horizontal prefix is load-bearing, not decoration. The
        // variant compiles to :where(), which carries no specificity, so a bare
        // w-* ties with the w-full slider.tsx sets and the winner is decided by
        // stylesheet order — where w-full happens to come later. Matching the
        // prefix is what lets tailwind-merge recognise the two as the same
        // class and drop the one underneath, instead of leaving both to race.
        className='data-horizontal:w-40 md:data-horizontal:w-25'
        // The range lives in the store, which is also what clamps whatever
        // comes back from localStorage. Hardcoding it here again would let the
        // widget and the persisted value drift apart.
        min={SPEED_MIN}
        max={SPEED_MAX}
        step={SPEED_STEP}
        value={[speed]}
        onValueChange={(value) => {
          setSpeed(Array.isArray(value) ? value[0] : value)
        }}
      />
      <span className='shrink-0 font-mono text-muted-foreground text-xs tabular-nums'>
        {speed}× · {duration}ms
      </span>
    </div>
  )
}
