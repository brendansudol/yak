export interface IResults {
  duration: number
  language: string
  segments: ISegment[]
  task: string
  text: string
}

export interface ISegment {
  id: number
  end: number
  seek: number
  text: string
  start: number
  tokens: number[]
  avg_logprob: number
  temperature: number
  no_speech_prob: number
  compression_ratio: number
}
