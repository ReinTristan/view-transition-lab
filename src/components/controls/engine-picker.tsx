import { ControlSelect } from '@/components/controls/control-select'
import { useEngineId, useThemeStore } from '@/themes/use-theme-store'
import { engineList, isEngineId } from '@/transitions'

/** Who runs the animation. The widget itself is ControlSelect. */
export function EnginePicker() {
  const active = useEngineId()
  const setEngine = useThemeStore((state) => state.setEngine)

  return (
    <ControlSelect
      id='engine'
      label='Engine'
      value={active}
      choices={engineList.map((engine) => ({
        id: engine.id,
        label: engine.label,
        blurb: engine.blurb,
        ready: engine.ready,
      }))}
      // Guarded rather than cast: the Select hands back a loose value, and an
      // id that is not an engine has no business reaching the store.
      onChange={(value) => {
        if (isEngineId(value)) setEngine(value)
      }}
    />
  )
}
