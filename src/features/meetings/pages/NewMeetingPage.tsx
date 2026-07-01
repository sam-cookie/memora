import { NewMeetingForm } from '../components/NewMeetingForm'

export function NewMeetingPage() {
  return (
    <div className="p-6 space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold">New Meeting</h1>
        <p className="text-sm text-muted-foreground">Upload a recording or transcript</p>
      </div>
      <NewMeetingForm />
    </div>
  )
}
