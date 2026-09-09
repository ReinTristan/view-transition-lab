import { ControlSelect } from '@/components/controls/control-select'
import { useEngineId, useMode, useThemeStore } from '@/themes/use-theme-store'
import { engineMeta, isTransitionMode } from '@/transitions'

/**
 * How the selected engine produces the wipe. The list is the engine's declared
 * modes and the pickable ones are its readyModes, which are derived from the
 * loader table — so overlay stops being greyed out the day a module implements
 * it, with nothing here to edit.
 *
 * Changing engine does not have to be handled: the store reconciles the mode
 * inside setEngine, so this select always shows a pair that can run.
 */
export function ModePicker() {
  const engine = engineMeta(useEngineId())
  const mode = useMode()
  const setMode = useThemeStore((state) => state.setMode)

  return (
    <ControlSelect
      id='mode'
      label='Mode'
      value={mode}
      choices={engine.modes.map((id) => ({
        id,
        label: id,
        ready: engine.readyModes.includes(id),
      }))}
      onChange={(value) => {
        if (isTransitionMode(value)) setMode(value)
      }}
    />
  )
}
