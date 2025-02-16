import { defineComponent, ref, nextTick, onMounted } from 'vue'

import { FocusTrap } from './focus-trap'
import { assertActiveElement, getByText } from '../../test-utils/accessibility-assertions'
import { suppressConsoleLogs } from '../../test-utils/suppress-console-logs'
import { render } from '../../test-utils/vue-testing-library'
import { click, press, shift, Keys } from '../../test-utils/interactions'
import { html } from '../../test-utils/html'

jest.mock('../../hooks/use-id')

beforeAll(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(setImmediate as any)
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(clearImmediate as any)
})

afterAll(() => jest.restoreAllMocks())

function renderTemplate(input: string | Partial<Parameters<typeof defineComponent>[0]>) {
  let defaultComponents = { FocusTrap }

  if (typeof input === 'string') {
    return render(defineComponent({ template: input, components: defaultComponents }))
  }

  return render(
    defineComponent(
      Object.assign({}, input, {
        components: { ...defaultComponents, ...input.components },
      }) as Parameters<typeof defineComponent>[0]
    )
  )
}

it('should focus the first focusable element inside the FocusTrap', async () => {
  renderTemplate(
    html`
      <headlessui-focus-trap>
        <button>Trigger</button>
      </headlessui-focus-trap>
    `
  )

  await new Promise(nextTick)

  assertActiveElement(getByText('Trigger'))
})

it('should focus the autoFocus element inside the FocusTrap if that exists', async () => {
  renderTemplate({
    template: html`
      <headlessui-focus-trap>
        <input id="a" type="text" />
        <input id="b" type="text" ref="autofocus" />
        <input id="c" type="text" />
      </headlessui-focus-trap>
    `,
    setup() {
      let autofocus = ref<HTMLElement | null>(null)
      onMounted(() => {
        autofocus.value?.focus?.()
      })
      return { autofocus }
    },
  })

  await new Promise(nextTick)

  assertActiveElement(document.getElementById('b'))
})

it('should focus the initialFocus element inside the FocusTrap if that exists', async () => {
  renderTemplate({
    template: html`
      <headlessui-focus-trap :initialFocus="initialFocusRef">
        <input id="a" type="text" />
        <input id="b" type="text" />
        <input id="c" type="text" ref="initialFocusRef" />
      </headlessui-focus-trap>
    `,
    setup() {
      let initialFocusRef = ref(null)
      return { initialFocusRef }
    },
  })

  await new Promise(nextTick)

  assertActiveElement(document.getElementById('c'))
})

it('should focus the initialFocus element inside the FocusTrap even if another element has autoFocus', async () => {
  renderTemplate({
    template: html`
      <headlessui-focus-trap :initialFocus="initialFocusRef">
        <input id="a" type="text" />
        <input id="b" type="text" autofocus />
        <input id="c" type="text" ref="initialFocusRef" />
      </headlessui-focus-trap>
    `,
    setup() {
      let initialFocusRef = ref(null)
      return { initialFocusRef }
    },
  })

  await new Promise(nextTick)

  assertActiveElement(document.getElementById('c'))
})

it(
  'should error when there is no focusable element inside the FocusTrap',
  suppressConsoleLogs(async () => {
    expect.assertions(1)

    renderTemplate({
      template: html`
        <headlessui-focus-trap>
          <span>Nothing to see here...</span>
        </headlessui-focus-trap>
      `,
      errorCaptured(err: unknown) {
        expect((err as Error).message).toMatchInlineSnapshot(
          `"There are no focusable elements inside the <headlessui-focus-trap />"`
        )
        return false
      },
    })

    await new Promise(nextTick)
  })
)

it(
  'should not be possible to programmatically escape the focus trap',
  suppressConsoleLogs(async () => {
    renderTemplate({
      template: html`
        <div>
          <input id="a" autofocus />

          <headlessui-focus-trap>
            <input id="b" />
            <input id="c" />
            <input id="d" />
          </headlessui-focus-trap>
        </div>
      `,
    })

    await new Promise(nextTick)

    let [a, b, c, d] = Array.from(document.querySelectorAll('input'))

    // Ensure that input-b is the active element
    assertActiveElement(b)

    // Tab to the next item
    await press(Keys.Tab)

    // Ensure that input-c is the active element
    assertActiveElement(c)

    // Try to move focus
    a?.focus()

    // Ensure that input-c is still the active element
    assertActiveElement(c)

    // Click on an element within the FocusTrap
    await click(b)

    // Ensure that input-b is the active element
    assertActiveElement(b)

    // Try to move focus again
    a?.focus()

    // Ensure that input-b is still the active element
    assertActiveElement(b)

    // Focus on an element within the FocusTrap
    d?.focus()

    // Ensure that input-d is the active element
    assertActiveElement(d)

    // Try to move focus again
    a?.focus()

    // Ensure that input-d is still the active element
    assertActiveElement(d)
  })
)

it('should restore the previously focused element, before entering the FocusTrap, after the FocusTrap unmounts', async () => {
  renderTemplate({
    template: html`
      <div>
        <input id="item-1" ref="autoFocusRef" />
        <button id="item-2" @click="visible = true">
          Open modal
        </button>

        <headlessui-focus-trap v-if="visible">
          <button id="item-3" @click="visible = false">
            Close
          </button>
        </headlessui-focus-trap>
      </div>
    `,
    setup() {
      let visible = ref(false)
      let autoFocusRef = ref<HTMLElement | null>(null)
      onMounted(() => {
        autoFocusRef.value?.focus()
      })
      return { visible, autoFocusRef }
    },
  })

  await new Promise(nextTick)

  // The input should have focus by default because of the autoFocus prop
  assertActiveElement(document.getElementById('item-1'))

  // Open the modal
  await click(document.getElementById('item-2')) // This will also focus this button

  // Ensure that the first item inside the focus trap is focused
  assertActiveElement(document.getElementById('item-3'))

  // Close the modal
  await click(document.getElementById('item-3'))

  // Ensure that we restored focus correctly
  assertActiveElement(document.getElementById('item-2'))
})

it('should be possible to tab to the next focusable element within the focus trap', async () => {
  renderTemplate(
    html`
      <div>
        <button>Before</button>
        <headlessui-focus-trap>
          <button id="item-a">Item A</button>
          <button id="item-b">Item B</button>
          <button id="item-c">Item C</button>
        </headlessui-focus-trap>
        <button>After</button>
      </div>
    `
  )

  await new Promise(nextTick)

  // Item A should be focused because the FocusTrap will focus the first item
  assertActiveElement(document.getElementById('item-a'))

  // Next
  await press(Keys.Tab)
  assertActiveElement(document.getElementById('item-b'))

  // Next
  await press(Keys.Tab)
  assertActiveElement(document.getElementById('item-c'))

  // Loop around!
  await press(Keys.Tab)
  assertActiveElement(document.getElementById('item-a'))
})

it('should be possible to shift+tab to the previous focusable element within the focus trap', async () => {
  renderTemplate(
    html`
      <div>
        <button>Before</button>
        <headlessui-focus-trap>
          <button id="item-a">Item A</button>
          <button id="item-b">Item B</button>
          <button id="item-c">Item C</button>
        </headlessui-focus-trap>
        <button>After</button>
      </div>
    `
  )

  // Item A should be focused because the FocusTrap will focus the first item
  assertActiveElement(document.getElementById('item-a'))

  // Previous (loop around!)
  await press(shift(Keys.Tab))
  assertActiveElement(document.getElementById('item-c'))

  // Previous
  await press(shift(Keys.Tab))
  assertActiveElement(document.getElementById('item-b'))

  // Previous
  await press(shift(Keys.Tab))
  assertActiveElement(document.getElementById('item-a'))
})

it('should skip the initial "hidden" elements within the focus trap', async () => {
  renderTemplate(
    html`
      <div>
        <button id="before">Before</button>
        <headlessui-focus-trap>
          <button id="item-a" style="display:none">
            Item A
          </button>
          <button id="item-b" style="display:none">
            Item B
          </button>
          <button id="item-c">Item C</button>
          <button id="item-d">Item D</button>
        </headlessui-focus-trap>
        <button>After</button>
      </div>
    `
  )

  // Item C should be focused because the FocusTrap had to skip the first 2
  assertActiveElement(document.getElementById('item-c'))
})

it('should be possible skip "hidden" elements within the focus trap', async () => {
  renderTemplate(
    html`
      <div>
        <button id="before">Before</button>
        <headlessui-focus-trap>
          <button id="item-a">Item A</button>
          <button id="item-b">Item B</button>
          <button id="item-c" style="display:none">
            Item C
          </button>
          <button id="item-d">Item D</button>
        </headlessui-focus-trap>
        <button>After</button>
      </div>
    `
  )

  // Item A should be focused because the FocusTrap will focus the first item
  assertActiveElement(document.getElementById('item-a'))

  // Next
  await press(Keys.Tab)
  assertActiveElement(document.getElementById('item-b'))

  // Notice that we skipped item-c

  // Next
  await press(Keys.Tab)
  assertActiveElement(document.getElementById('item-d'))

  // Loop around!
  await press(Keys.Tab)
  assertActiveElement(document.getElementById('item-a'))
})

it('should be possible skip disabled elements within the focus trap', async () => {
  renderTemplate(
    html`
      <div>
        <button id="before">Before</button>
        <headlessui-focus-trap>
          <button id="item-a">Item A</button>
          <button id="item-b">Item B</button>
          <button id="item-c" disabled>
            Item C
          </button>
          <button id="item-d">Item D</button>
        </headlessui-focus-trap>
        <button>After</button>
      </div>
    `
  )

  // Item A should be focused because the FocusTrap will focus the first item
  assertActiveElement(document.getElementById('item-a'))

  // Next
  await press(Keys.Tab)
  assertActiveElement(document.getElementById('item-b'))

  // Notice that we skipped item-c

  // Next
  await press(Keys.Tab)
  assertActiveElement(document.getElementById('item-d'))

  // Loop around!
  await press(Keys.Tab)
  assertActiveElement(document.getElementById('item-a'))
})
