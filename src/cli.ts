#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { buildRequest } from './build.js'
import { defaults, isUseCaseName, useCaseNames, type UseCaseName } from './defaults.js'
import { decideFixture, judge } from './judge.js'
import { questionsFor } from './usecases.js'
import type { Json } from './types.js'

type Io = {
  stdout: (text: string) => void
  stderr: (text: string) => void
  env: Record<string, string | undefined>
  stdin: () => string
}

type Args =
  | { kind: 'help' }
  | { kind: 'error'; message: string }
  | { kind: 'questions'; useCase: UseCaseName; options: Record<string, string | null> }
  | { kind: 'dry-run' | 'fixture' | 'live'; file?: string }

const HELP = `jev — judgments for coding agents

  jev questions <${useCaseNames.join('|')}> [--option key=value]
  jev --dry-run --file request.json
  jev --fixture response.json
  jev --file request.json

Dry-run and fixture do not call the network. A live call reads the API key
from the environment and never prints it. Fallback output is not a Jev answer.
`

export async function main(argv: string[], io: Io): Promise<number> {
  const args = parseArgs(argv)
  if (args.kind === 'help') {
    io.stdout(HELP)
    return 0
  }
  if (args.kind === 'error') {
    io.stderr(`${args.message}\n`)
    return 1
  }
  if (args.kind === 'questions') return printQuestions(args.useCase, args.options, io)
  try {
    const payload = JSON.parse(args.file ? readFileSync(args.file, 'utf8') : io.stdin()) as unknown
    if (args.kind === 'fixture') {
      io.stdout(json(decideFixture(payload)))
      return 0
    }
    const request = asRequest(payload)
    if (!request.ok) {
      io.stderr(`${request.error}\n`)
      return 1
    }
    if (args.kind === 'dry-run') {
      const built = buildRequest(request.value)
      if (!built.ok) {
        io.stderr(`${built.error}\n`)
        return 1
      }
      io.stdout(json(built.body))
      return 0
    }
    const result = await judge(request.value, { env: io.env })
    io.stdout(json(result))
    return 0
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : 'Failed to read input.'}\n`)
    return 1
  }
}

function printQuestions(
  useCase: UseCaseName,
  options: Record<string, string | null>,
  io: Io,
): number {
  try {
    const questions = questionsFor(useCase, options)
    io.stdout(json({ state: '', model: defaults.model, questions }))
    return 0
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : 'Could not build questions.'}\n`)
    return 1
  }
}

function asRequest(payload: unknown): { ok: true; value: { state: Json; questions: Record<string, unknown>; model?: string } } | { ok: false; error: string } {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { ok: false, error: 'Request must be a JSON object with state and questions.' }
  }
  const record = payload as Record<string, unknown>
  if (!('state' in record) || !('questions' in record)) {
    return { ok: false, error: 'Request must include state and questions.' }
  }
  const model = typeof record.model === 'string' ? record.model : undefined
  return {
    ok: true,
    value: {
      state: record.state as Json,
      questions: record.questions as Record<string, unknown>,
      ...(model ? { model } : {}),
    },
  }
}

export function parseArgs(argv: string[]): Args {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) return { kind: 'help' }
  const file = readFlag(argv, '--file') ?? readFlag(argv, '-f')
  if (file instanceof Error) return { kind: 'error', message: file.message }
  if (argv[0] === 'questions') return parseQuestions(argv.slice(1))
  const mode = argv.includes('--fixture') ? 'fixture' : argv.includes('--dry-run') ? 'dry-run' : 'live'
  if ((mode === 'fixture' || mode === 'dry-run' || mode === 'live') && argv.includes('--file') && !file) {
    return { kind: 'error', message: '--file needs a path.' }
  }
  return { kind: mode, ...(file ? { file } : {}) }
}

function parseQuestions(argv: string[]): Args {
  const name = argv[0]
  if (!name || !isUseCaseName(name)) {
    return { kind: 'error', message: `questions needs one of: ${useCaseNames.join(', ')}.` }
  }
  const options: Record<string, string | null> = {}
  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] !== '--option') {
      return { kind: 'error', message: `Unknown argument "${argv[i] ?? ''}". Expected --option key=value.` }
    }
    const pair = argv[i + 1]
    i += 1
    if (!pair || !pair.includes('=')) {
      return { kind: 'error', message: '--option needs key=value.' }
    }
    const cut = pair.indexOf('=')
    options[pair.slice(0, cut)] = pair.slice(cut + 1)
  }
  return { kind: 'questions', useCase: name, options }
}

function readFlag(argv: string[], flag: string): string | undefined | Error {
  const index = argv.indexOf(flag)
  if (index === -1) return undefined
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) return new Error(`${flag} needs a path.`)
  return value
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

function invokedDirectly(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return import.meta.url === pathToFileURL(realpathSync(entry)).href
  } catch {
    return false
  }
}

if (invokedDirectly()) {
  const code = await main(process.argv.slice(2), {
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
    env: process.env,
    stdin: () => readFileSync(0, 'utf8'),
  })
  process.exit(code)
}
