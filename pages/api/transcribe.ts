import formidable, { Fields, File } from "formidable"
import FormData from "form-data"
import fs from "fs"
import type { NextApiRequest, NextApiResponse } from "next"
import { Configuration, OpenAIApi } from "openai"

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY })
const openai = new OpenAIApi(configuration)

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  if (req.method !== "POST") {
    return res.status(500).json({ status: "error", reason: "invalid request" })
  }

  const { file } = await parseForm(req)
  if (file == null) {
    return res.status(500).json({ status: "error", reason: "no file found" })
  }

  const formData = new FormData()
  formData.append("model", "whisper-1")
  formData.append("response_format", "verbose_json")
  formData.append("file", fs.createReadStream(file.filepath), {
    filename: file.originalFilename ?? undefined,
    contentType: file.mimetype ?? undefined,
  })

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    method: "POST",
    body: formData as any,
  })
  const results = await response.json()

  return res.status(200).json({ results })
}

export const config = {
  api: { bodyParser: false },
}

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; file: File | undefined }> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm()
    form.parse(req, (err, fields, files) => {
      if (err) reject({ err })

      let file = files["file"]
      if (Array.isArray(file)) file = file[0]

      resolve({ fields, file })
    })
  })
}
