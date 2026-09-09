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
      <Select value={value} onValueChange={(next) => onChange(String(next))}>
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
        <SelectContent>
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
