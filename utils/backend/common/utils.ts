export const ONE_MILLI_SECOND: number = 1000;
export const ONE_MICRO_SECOND: number = ONE_MILLI_SECOND * 1000;
export const ONE_NANO_SECOND: number = ONE_MICRO_SECOND * 1000;
export const ONE_MINUTE_IN_NS: number = ONE_NANO_SECOND * 60;
export const ONE_HOUR_IN_NS: number = ONE_MINUTE_IN_NS * 60;
export const ONE_DAY_IN_NS: number = ONE_HOUR_IN_NS * 24;
export const ONE_WEEK_IN_NS: number = ONE_DAY_IN_NS * 7;
export const ONE_MONTH_IN_NS: number = ONE_DAY_IN_NS * 30;
export const ONE_YEAR_IN_NS: number = ONE_DAY_IN_NS * 365;
export const nanoToMinuteFactor: number = 60000000000;

export function is_testnet_env(): boolean {
    const env = process.env.NEXT_PUBLIC_NEAR_NETWORK_ID || "testnet";
    return env == "testnet";
}

export function assert<T>(condition: T, message?: string): asserts condition {
    if (!condition) {
        throw message;
    }
}

// reference [https://stackoverflow.com/a/14668510]
export function to_number(str: string): number {
    return +str;// unary '+' operator converts string to number...
}

/*
 * guid utils [https://stackoverflow.com/questions/26501688/a-typescript-guid-class]
 */
export class Guid {
    static newGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
    }
}

/*
 * general utils
 */
export function clamp(number: number, min: number, max: number): number {
    return Math.max(min, Math.min(number, max))
}

export function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min)
}

export function getRandomFloat(min: number, max: number): number {
    return getRandomNumber(
        Math.round(min * 100),
        Math.round(max * 100)
    ) / 100
}

export function getRandomVector2(vector: number[]): number {
    if (vector.length != 2) {
        throw 'Invalid parameter count'
    }
    return getRandomNumber(vector[0], vector[1])
}

export function shuffle(array: any[]): any[] {
    let i = array.length

    while (i-- > 1) {
        const j = getRandomNumber(0, i + 1)
        const value = array[j]

        array[j] = array[i]
        array[i] = value
    }

    return array
}

/*
 * week number utils
 */
type WeekCodeType = {
    Week: number,
    Year: number,
}

function ISO8601_Week_No(today: Date = new Date()): WeekCodeType {
    const tdt = new Date(today.valueOf())
    const dayn = (today.getDay() + 6) % 7

    tdt.setDate(tdt.getDate() - dayn + 3)

    const firstThursday = tdt.valueOf()
    tdt.setMonth(0, 1)

    if (tdt.getDay() !== 4) {
        tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7)
    }

    return {
        Week: 1 + Math.ceil((firstThursday - tdt.valueOf()) / 604800000),
        Year: tdt.getFullYear(),
    }
}

function getOffsetWeekTimestamp(today: Date = new Date(), offset: number): number {
    const weekCodeType = getWeekCodeType(today)

    let week_num: number = weekCodeType.Week
    let timestamp: number = 0
    let days: number = 0

    do {
        const dt = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + days,
        )

        const wct = getWeekCodeType(dt)
        week_num = wct.Week
        timestamp = dt.valueOf()
        days += offset
    } while (week_num == weekCodeType.Week)

    return timestamp
}

function getWeekCodeString(today: Date = new Date()): string {
    const wct = getWeekCodeType(today)
    if (wct.Week < 10) {
        return `W0${wct.Week}Y${wct.Year}`
    }
    return `W${wct.Week}Y${wct.Year}`
}

function getWeekCodeType(today: Date = new Date()): WeekCodeType {
    return ISO8601_Week_No(today)
}

export function getPreviousWeekCode(today: Date = new Date()): string {
    const prev = new Date(getPreviousWeekTimestamp(today))
    const code = getWeekCodeString(prev)
    return code
}

export function getCurrentWeekCode(today: Date = new Date()): string {
    const code = getWeekCodeString(today)
    return code;
}

export function getNextWeekCode(today: Date = new Date()): string {
    const next = new Date(getNextWeekTimestamp(today))
    const code = getWeekCodeString(next)
    return code
}

export function getNextWeekTimestamp(today: Date = new Date()): number {
    return getOffsetWeekTimestamp(today, +1)
}

export function getPreviousWeekTimestamp(today: Date = new Date()): number {
    return getOffsetWeekTimestamp(today, -1)
}

/*
 * date utils
 */

export function addMinutes(minutes: number, date: Date = new Date()) {
    return new Date(date.getTime() + minutes * 60000);
}

/*
 * numeric utils
 */

export class Vector2 {
    constructor(
        public x: number,
        public y: number,
    ) { }

    static one(mul: number = 1): Vector2 {
        return new Vector2(1 * mul, 1 * mul);
    }

    static distance(a: Vector2, b: Vector2): number {
        const dx: number = a.x - b.x;
        const dy: number = a.y - b.y;
        const sqrt: number = Math.sqrt(dx * dx + dy * dy);

        return sqrt;
    }

    static compare(left: Vector2, right: Vector2, position: Vector2): number {
        const x: number = Vector2.distance(left, position);
        const y: number = Vector2.distance(right, position);
        const value: number = x < y ? -1 : x > y ? 1 : 0;

        return value;
    }
}