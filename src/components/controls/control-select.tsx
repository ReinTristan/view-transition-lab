import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface ControlChoice {
  id: string
  label: string
  /** Shown as the item's title. */
  blurb?: string
  /** false makes the item visible but unpickable, suffixed with "· pending". */
  ready: boolean
}

/**
 * One axis of the lab, as a labelled select. Engine, mode and an engine's own
 * option are the same widget — label, a list where unimplemented entries are
 * shown but blocked, and a trigger that prints labels rather than ids — so it
 * lives here once instead of three times.
 *
 * Showing what is not implemented yet, greyed, is deliberate: the lab is about
 * what the axes are, and hiding the empty slots would hide half the map.
 *
 * It renders a fragment, not a box: the settings popover lays its rows out on a
 * two-column grid, so the label and the trigger have to be grid children.
 */
export function ControlSelect({
  id,
  label,
  value,
  choices,
  onChange,
}: {
  id: string
  label: string
  value: string
  choices: ControlChoice[]
  onChange: (value: string) => void
}) {
  return (
    <>
      <Label htmlFor={id} className='text-muted-foreground text-xs'>
        {label}
      </Label>
      {/* These two props are the whole of the scrollbar bug, and it takes both
          of them — the lock has two independent triggers.

          Base UI locks page scroll while a select list is open, and the
          condition is `(alignItemWithTriggerActive || modal) && open`
          (select/positioner/SelectPositioner.js). modal ships as true, and
          alignItemWithTrigger — the native-select behaviour where the popup
          overlays the trigger with the current item on top of it — ships as
          true as well and locks on its own account, which is why turning off
          only modal changes nothing.

          What the lock does: <body> gets an inline overflow:hidden and, on a
          browser with classic scrollbars, <html> gets a scrollbar-gutter:stable
          to pay back the 15px. The page bar disappears and its reserved groove
          stays painted where it was, which reads as a second, dead scrollbar.

          The popover was never the culprit, which is the part that costs an
          afternoon to rediscover: Popover.Root defaults to modal={false} and
          writes nothing to the document at all.

          It is also not fixable from CSS. Base UI writes inline styles, so
          there is no `[data-scroll-locked]` hook of the kind react-remove-scroll
          (Radix) gives you. The props are the only lever.

          Nothing here wants either behaviour: three to five short entries
          inside a popover that already dismisses itself. Dropping the trigger
          alignment also turns anchor tracking back on, so the list follows the
          trigger instead of needing the page pinned. */}
      <Select
        modal={false}
        value={value}
        onValueChange={(next) => onChange(String(next))}
      >
        <SelectTrigger id={id} size='sm' className='w-full'>
          {/* SelectValue renders the raw value unless it is handed a formatter,
              so the trigger would print the id. The list feeding the popup is
              the same one — no second map to keep in sync. */}
          <SelectValue>
            {(current) =>
              choices.find((choice) => choice.id === current)?.label ?? current
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {choices.map((choice) => (
            <SelectItem
              key={choice.id}
              value={choice.id}
              disabled={!choice.ready}
              title={choice.blurb}
            >
              {choice.label}
              {!choice.ready && ' · pending'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
