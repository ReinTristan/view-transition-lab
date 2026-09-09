import { SettingsIcon } from 'lucide-react'
import { EngineOptionPicker } from '@/components/controls/engine-option-picker'
import { EnginePicker } from '@/components/controls/engine-picker'
import { ModePicker } from '@/components/controls/mode-picker'
import { SpeedSlider } from '@/components/controls/speed-slider'
import { CHROME_FONT } from '@/components/layout/chrome'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIsTransitioning } from '@/themes/use-theme-store'

/**
 * The axes, behind one button. They used to sit inline in the bar, which worked
 * for three controls and stopped working at six: mode and the engine's own
 * option had nowhere to go, and the curtain axis is still to come.
 *
 * The price is real and accepted — the axes are no longer readable at a glance,
 * and comparing costs one more click. The place they all have to be visible at
 * once is the side-by-side comparison on /, not the bar.
 *
 * CHROME_FONT on the popup is what makes this work at all, and for two separate
 * reasons — see chrome.ts. The popup portalizes into body, so without it the
 * controls would take the active theme's typeface and would not dim during a
 * wipe.
 *
 * While a wipe plays, an open popover is inert like everything else: hit-testing
 * resolves to the root element for as long as the pseudo-elements are painted.
 * That is the browser, not a bug of the popover.
 */
export function SettingsPopover() {
  const running = useIsTransitioning()

  return (
    <Popover>
      <PopoverTrigger render={<Button size='sm' variant='ghost' />}>
        <SettingsIcon className='size-3.5' />
        settings
      </PopoverTrigger>
      <PopoverContent
        align='start'
        aria-busy={running}
        // The rows are label | control, so every control lines up whatever the
        // label says. The pickers render fragments precisely so their two halves
        // land as grid children.
        className={`${CHROME_FONT} grid w-80 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5`}
      >
        <EnginePicker />
        <ModePicker />
        <EngineOptionPicker />
        <SpeedSlider />
      </PopoverContent>
    </Popover>
  )
}
