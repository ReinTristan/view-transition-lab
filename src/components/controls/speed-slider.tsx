import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { BASE_DURATION } from '@/themes/store'
import { setSpeed, useSpeed } from '@/themes/use-theme'

/**
 * Slowing the wipe down is what makes a view transition inspectable without
 * fighting the DevTools animation panel.
 */
export function SpeedSlider() {
  const speed = useSpeed()
  const duration = Math.round(BASE_DURATION / speed)

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='speed' className='text-muted-foreground text-xs'>
        Speed
      </Label>
      <Slider
        id='speed'
        className='w-28'
        min={0.25}
        max={2}
        step={0.25}
        value={[speed]}
        onValueChange={(value) => {
          setSpeed(Array.isArray(value) ? value[0] : value)
        }}
      />
      <span className='w-20 shrink-0 font-mono text-muted-foreground text-xs tabular-nums'>
        {speed}× · {duration}ms
      </span>
    </div>
  )
}
