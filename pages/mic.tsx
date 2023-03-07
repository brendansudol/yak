import React, { useCallback, useRef, useState } from "react"

export default function Recorder() {
  const mediaRecorder = useRef<MediaRecorder>()
  const audioChunks = useRef<Blob[]>([])

  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string>()
  const [transcript, setTranscript] = useState<string>("")

  const handleStart = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" })
    mediaRecorder.current = mr

    mr.start(5_000)
    setIsRecording(true)

    mr.addEventListener("dataavailable", async (evt) => {
      if (evt.data.size === 0) return
      audioChunks.current.push(evt.data)

      const formData = new FormData()
      const blob = new Blob(audioChunks.current, { type: "audio/webm" })
      formData.append("file", blob, "recording.webm")

      const response = await fetch("/api/transcribe", { method: "POST", body: formData })
      const json = await response.json()
      console.log(json)
      setTranscript(json.results.text)
    })

    mr.addEventListener("stop", () => {
      setIsRecording(false)
      const blob = new Blob(audioChunks.current, { type: "audio/webm" })
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      // TODO: chunk reset?
    })
  }, [])

  const handleStop = useCallback(() => {
    mediaRecorder.current?.stop()
  }, [])

  return (
    <div className="p-10">
      <div>
        <button className="border" onClick={handleStart} disabled={isRecording}>
          start
        </button>
        <button className="border" onClick={handleStop} disabled={!isRecording}>
          stop
        </button>
      </div>
      {audioUrl != null && <audio src={audioUrl} controls />}
      <div>{transcript}</div>
    </div>
  )
}
