import { FC, useState } from "react"
import Input from "../../../components/Input"
import Modal from "../../../components/Modal"

interface CustomTimeProps { 
  isOpen: boolean
  onDismiss: () => void
  onSubmit: (label: string, value: number) => void;
}

type timeUnit = "days" | "hours" | "minutes" 

const milliseconds = { 
  day: 86400000, 
  hour: 3600000, 
  minute: 60000, 
}

const CustomTime: FC<CustomTimeProps> = ({ isOpen, onDismiss, onSubmit }) => {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0})

  const onTimeChange = (unit: timeUnit, value: string) => { 
    setTime({ 
      ...time, 
      [unit]: parseInt(value)
    })
  }

  const submit = () => { 
    onSubmit(
      "custom", 
      time.days * milliseconds.day + time.hours * milliseconds.hour + time.minutes * milliseconds.minute
    )
  }

  return (
    <Modal maxWidth={250} isOpen={isOpen} onDismiss={onDismiss}>
      <h2 className="font-semibold text-20 mb-5">Custom Time</h2>
      <div className="font-medium">
        <div className="flex items-center justify-between my-4">
          <p>Days</p>
          <div className="bg-dark-700 rounded">
            <Input.Numeric value={time.days} onUserInput={(value) => onTimeChange("days", value)} className="w-20 bg-transparent p-2 text-center"/>
          </div>
        </div>
        <div className="flex items-center justify-between my-4">
          <p>Hours</p>
          <div className="bg-dark-700 rounded">
            <Input.Numeric value={time.hours} onUserInput={(value) => onTimeChange("hours", value)} className="w-20 bg-transparent p-2 text-center"/>
          </div>
        </div>
        <div className="flex items-center justify-between my-4">
          <p>Minutes</p>
          <div className="bg-dark-700 rounded">
            <Input.Numeric value={time.minutes} onUserInput={(value) => onTimeChange("minutes", value)} className="w-20 bg-transparent p-2 text-center"/>
          </div>
        </div>
      </div>
      <button onClick={() => submit()}>Accept</button>
    </Modal>
  )
}

export default CustomTime; 
