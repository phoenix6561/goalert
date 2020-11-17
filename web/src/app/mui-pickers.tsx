import React from 'react'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import PickerUtils from '@date-io/luxon'

interface PickersUtilsProviderProps {
  children: React.ReactNode
}
export default function PickersUtilsProvider(
  props: PickersUtilsProviderProps,
): JSX.Element {
  return (
    <MuiPickersUtilsProvider utils={PickerUtils}>
      {props.children}
    </MuiPickersUtilsProvider>
  )
}
