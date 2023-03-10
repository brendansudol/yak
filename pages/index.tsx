import classNames from "classnames"
import Head from "next/head"
import React, { ChangeEvent, FormEvent, useCallback, useRef, useState } from "react"
import { Transcript } from "@/components/Transcript"
import { ISegment, ITranscript } from "@/types"

const AUDIO_MIME_TYPE = "audio/webm"

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const mediaRecorder = useRef<MediaRecorder>()
  const audioChunks = useRef<Blob[]>([])

  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string>()
  const [transcript, setTranscript] = useState<ITranscript>()
  const [currentSegment, setCurrentSegment] = useState<ISegment>()

  const handleTimeUpdate = useCallback(
    (e: FormEvent<HTMLAudioElement>) => {
      const time = e.currentTarget.currentTime
      const curr = currentSegment
      if (transcript == null || (curr != null && curr.start <= time && time < curr.end)) return
      const idx = findSegmentIdx(transcript.segments, time)
      setCurrentSegment(transcript.segments[idx])
    },
    [currentSegment, transcript]
  )

  const handleTranscriptClick = useCallback((segment: ISegment) => {
    const audio = audioRef.current
    if (audio == null) return
    setCurrentSegment(segment)
    audio.currentTime = segment.start + 0.01
    if (audio.paused) audio.play()
  }, [])

  const handleSubmit = useCallback(async (file: Blob, fileName: string) => {
    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append("file", file, fileName)
      const response = await fetch("/api/transcribe", { method: "POST", body: formData })
      const { results } = await response.json()
      setTranscript(results)
      setAudioUrl(URL.createObjectURL(file))
    } catch (error) {
      console.error("error getting transcript", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFileUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.currentTarget.files?.[0]
      if (file == null) return
      e.target.value = "" // in case user uploads same file again
      handleSubmit(file, file.name)
    },
    [handleSubmit]
  )

  const handleStartRecording = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream, { mimeType: AUDIO_MIME_TYPE })
    mediaRecorder.current = mr
    audioChunks.current = []

    mr.start(5_000)
    setIsRecording(true)

    mr.addEventListener("dataavailable", async (evt) => {
      if (evt.data.size === 0) return
      audioChunks.current.push(evt.data)
    })

    mr.addEventListener("stop", () => {
      setIsRecording(false)
      const blob = new Blob(audioChunks.current, { type: AUDIO_MIME_TYPE })
      handleSubmit(blob, "recording.webm")
    })
  }, [handleSubmit])

  const handleStopRecording = useCallback(() => {
    mediaRecorder.current?.stop()
  }, [])

  return (
    <>
      <Head>
        <title>yak</title>
        <meta name="description" content="TODO" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="mx-auto p-6 sm:px-10 max-w-screen-sm min-h-screen">
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm font-bold">
          <Button className="w-full" onClick={() => uploadRef.current?.click()}>
            Upload
          </Button>
          <Button
            className="w-full"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
          >
            Record
          </Button>
        </div>

        {audioUrl && (
          <audio
            ref={audioRef}
            autoPlay={true}
            className="my-6 w-full"
            controls={true}
            onTimeUpdate={handleTimeUpdate}
            src={audioUrl}
          />
        )}

        <pre className="my-6 p-2 text-sm border rounded-lg">
          {JSON.stringify({ isRecording, isLoading }, null, 2)}
        </pre>

        {transcript && (
          <Transcript
            segments={transcript.segments}
            currentId={currentSegment?.id}
            onSelect={handleTranscriptClick}
          />
        )}

        <input
          ref={uploadRef}
          accept=".mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
          className="hidden"
          onChange={handleFileUpload}
          type="file"
        />
      </main>
    </>
  )
}

function Button({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <button
      className={classNames(
        "py-3 px-4 flex items-center justify-center text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function findSegmentIdx(segments: ISegment[], target: number) {
  let [lo, hi] = [0, segments.length]
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2)
    if (target >= segments[mid].end) lo = mid + 1
    else hi = mid
  }
  return lo
}
