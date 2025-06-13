import type { Messages } from "@/lib/locale";

declare global {
	// Use type safe message keys with `next-intl`
	interface IntlMessages extends Messages {}
}
