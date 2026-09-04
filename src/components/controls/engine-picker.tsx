import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEngineId, useThemeStore } from '@/themes/use-theme-store'
import { engineList, isEngineId } from '@/transitions'

export function EnginePicker() {
  const active = useEngineId()
  const setEngine = useThemeStore((state) => state.setEngine)

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='engine' className='text-muted-foreground text-xs'>
        Engine
      </Label>
      <Select
        value={active}
        // Guarded rather than cast: the Select hands back a loose value, and
        // an id that is not an engine has no business reaching the store.
        onValueChange={(value) => {
          if (isEngineId(value)) setEngine(value)
        }}
      >
        <SelectTrigger id='engine' size='sm' className='w-40'>
          {/* SelectValue renders the raw value unless it is handed a formatter,
              so the trigger would print the id. engineList is already the list
              feeding the popup — no second map to keep in sync. */}
          <SelectValue>
            {(value) =>
              engineList.find((engine) => engine.id === value)?.label ?? value
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {engineList.map((engine) => (
            <SelectItem
              key={engine.id}
              value={engine.id}
              disabled={!engine.ready}
            >
              {engine.label}
              {!engine.ready && ' · pending'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
