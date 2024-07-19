import { defu } from 'defu'
import { fileURLToPath } from 'url'
import openAPINitroOptions from './config'
import type { NitroModule, NitroOptions } from 'nitropack'

export default function(): NitroModule {
	return {
		name: 'openapi',
		setup: nitro => {
			nitro.options = defu(openAPINitroOptions(nitro), nitro.options)
		},
	}
}
