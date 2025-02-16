import { defineComponent, ref, watch } from 'vue'
import { render } from '../../test-utils/vue-testing-library'

import { Switch, SwitchLabel, SwitchDescription, SwitchGroup } from './switch'
import {
  SwitchState,
  assertSwitch,
  getSwitch,
  assertActiveElement,
  getSwitchLabel,
  getByText,
} from '../../test-utils/accessibility-assertions'
import { press, click, Keys } from '../../test-utils/interactions'
import { html } from '../../test-utils/html'

jest.mock('../../hooks/use-id')

function renderTemplate(input: string | Partial<Parameters<typeof defineComponent>[0]>) {
  let defaultComponents = { Switch, SwitchLabel, SwitchDescription, SwitchGroup }

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

describe('Safe guards', () => {
  it('should be possible to render a Switch without crashing', () => {
    renderTemplate({
      template: html`
        <headlessui-switch v-model="checked" />
      `,
      setup: () => ({ checked: ref(false) }),
    })
  })
})

describe('Rendering', () => {
  it('should be possible to render an (on) Switch using a render prop', () => {
    renderTemplate({
      template: html`
        <headlessui-switch v-model="checked">
          {({ checked }) => <span>{checked ? 'On' : 'Off'}</span>}
        </headlessui-switch>
      `,
      setup: () => ({ checked: ref(true) }),
    })

    assertSwitch({ state: SwitchState.On, textContent: 'On' })
  })

  it('should be possible to render an (off) Switch using a render prop', () => {
    renderTemplate({
      template: html`
        <headlessui-switch v-model="checked">
          {({ checked }) => <span>{checked ? 'On' : 'Off'}</span>}
        </headlessui-switch>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    assertSwitch({ state: SwitchState.Off, textContent: 'Off' })
  })

  it('should be possible to render an (on) Switch using an `as` prop', () => {
    renderTemplate({
      template: html`
        <headlessui-switch as="span" v-model="checked" />
      `,
      setup: () => ({ checked: ref(true) }),
    })
    assertSwitch({ state: SwitchState.On, tag: 'span' })
  })

  it('should be possible to render an (off) Switch using an `as` prop', () => {
    renderTemplate({
      template: html`
        <headlessui-switch as="span" v-model="checked" />
      `,
      setup: () => ({ checked: ref(false) }),
    })
    assertSwitch({ state: SwitchState.Off, tag: 'span' })
  })

  it('should be possible to use the switch contents as the label', () => {
    renderTemplate({
      template: html`
        <headlessui-switch v-model="checked">
          <span>Enable notifications</span>
        </headlessui-switch>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    assertSwitch({ state: SwitchState.Off, label: 'Enable notifications' })
  })
})

describe('Render composition', () => {
  it('should be possible to render a SwitchGroup, Switch and SwitchLabel', async () => {
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch v-model="checked" />
          <headlessui-switch-label>Enable notifications</headlessui-switch-label>
        </headlessui-switch-group>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    await new Promise(requestAnimationFrame)

    assertSwitch({ state: SwitchState.Off, label: 'Enable notifications' })
  })

  it('should be possible to render a SwitchGroup, Switch and SwitchLabel (before the Switch)', async () => {
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch-label>Label B</headlessui-switch-label>
          <headlessui-switch v-model="checked">
            Label A
          </headlessui-switch>
        </headlessui-switch-group>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    await new Promise(requestAnimationFrame)

    // Warning! Using aria-label or aria-labelledby will hide any descendant content from assistive
    // technologies.
    //
    // Thus: Label A should not be part of the "label" in this case
    assertSwitch({ state: SwitchState.Off, label: 'Label B' })
  })

  it('should be possible to render a SwitchGroup, Switch and SwitchLabel (after the Switch)', async () => {
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch v-model="checked">
            Label A
          </headlessui-switch>
          <headlessui-switch-label>Label B</headlessui-switch-label>
        </headlessui-switch-group>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    await new Promise(requestAnimationFrame)

    // Warning! Using aria-label or aria-labelledby will hide any descendant content from assistive
    // technologies.
    //
    // Thus: Label A should not be part of the "label" in this case
    assertSwitch({ state: SwitchState.Off, label: 'Label B' })
  })

  it('should be possible to render a Switch.Group, Switch and Switch.Description (before the Switch)', async () => {
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch-description
            >This is an important feature</headlessui-switch-description
          >
          <headlessui-switch v-model="checked" />
        </headlessui-switch-group>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    await new Promise(requestAnimationFrame)

    assertSwitch({ state: SwitchState.Off, description: 'This is an important feature' })
  })

  it('should be possible to render a Switch.Group, Switch and Switch.Description (after the Switch)', async () => {
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch v-model="checked" />
          <headlessui-switch-description
            >This is an important feature</headlessui-switch-description
          >
        </headlessui-switch-group>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    await new Promise(requestAnimationFrame)

    assertSwitch({ state: SwitchState.Off, description: 'This is an important feature' })
  })

  it('should be possible to render a Switch.Group, Switch, Switch.Label and Switch.Description', async () => {
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch-label>Label A</headlessui-switch-label>
          <headlessui-switch v-model="checked" />
          <headlessui-switch-description
            >This is an important feature</headlessui-switch-description
          >
        </headlessui-switch-group>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    await new Promise(requestAnimationFrame)

    assertSwitch({
      state: SwitchState.Off,
      label: 'Label A',
      description: 'This is an important feature',
    })
  })

  it('should be possible to put classes on a SwitchLabel', async () => {
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch-label class="abc">Label A</headlessui-switch-label>
          <headlessui-switch v-model="checked" />
        </headlessui-switch-group>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    await new Promise(requestAnimationFrame)

    assertSwitch({
      state: SwitchState.Off,
      label: 'Label A',
    })

    expect(getByText('Label A')).toHaveClass('abc')
  })

  it('should be possible to put classes on a SwitchDescription', async () => {
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch-description class="abc">Description A</headlessui-switch-description>
          <headlessui-switch v-model="checked" />
        </headlessui-switch-group>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    await new Promise(requestAnimationFrame)

    assertSwitch({
      state: SwitchState.Off,
      description: 'Description A',
    })

    expect(getByText('Description A')).toHaveClass('abc')
  })

  it('should be possible to put classes on a SwitchGroup', async () => {
    renderTemplate({
      template: html`
        <headlessui-switch-group as="div" class="abc" id="group">
          <headlessui-switch v-model="checked" />
        </headlessui-switch-group>
      `,
      setup: () => ({ checked: ref(false) }),
    })

    await new Promise(requestAnimationFrame)

    assertSwitch({ state: SwitchState.Off })

    expect(document.getElementById('group')).toHaveClass('abc')
  })
})

describe('Keyboard interactions', () => {
  describe('`Space` key', () => {
    it('should be possible to toggle the Switch with Space', async () => {
      let handleChange = jest.fn()
      renderTemplate({
        template: html`
          <headlessui-switch v-model="checked" />
        `,
        setup() {
          let checked = ref(false)
          watch([checked], () => handleChange(checked.value))
          return { checked }
        },
      })

      // Ensure checkbox is off
      assertSwitch({ state: SwitchState.Off })

      // Focus the switch
      getSwitch()?.focus()

      // Toggle
      await press(Keys.Space)

      // Ensure state is on
      assertSwitch({ state: SwitchState.On })

      // Toggle
      await press(Keys.Space)

      // Ensure state is off
      assertSwitch({ state: SwitchState.Off })
    })
  })

  describe('`Enter` key', () => {
    it('should not be possible to use Enter to toggle the Switch', async () => {
      let handleChange = jest.fn()
      renderTemplate({
        template: html`
          <headlessui-switch v-model="checked" />
        `,
        setup() {
          let checked = ref(false)
          watch([checked], () => handleChange(checked.value))
          return { checked }
        },
      })

      // Ensure checkbox is off
      assertSwitch({ state: SwitchState.Off })

      // Focus the switch
      getSwitch()?.focus()

      // Try to toggle
      await press(Keys.Enter)

      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('`Tab` key', () => {
    it('should be possible to tab away from the Switch', async () => {
      renderTemplate({
        template: html`
          <div>
            <headlessui-switch v-model="checked" />
            <button id="btn">Other element</button>
          </div>
        `,
        setup: () => ({ checked: ref(false) }),
      })

      // Ensure checkbox is off
      assertSwitch({ state: SwitchState.Off })

      // Focus the switch
      getSwitch()?.focus()

      // Expect the switch to be active
      assertActiveElement(getSwitch())

      // Toggle
      await press(Keys.Tab)

      // Expect the button to be active
      assertActiveElement(document.getElementById('btn'))
    })
  })
})

describe('Mouse interactions', () => {
  it('should be possible to toggle the Switch with a click', async () => {
    let handleChange = jest.fn()
    renderTemplate({
      template: html`
        <headlessui-switch v-model="checked" />
      `,
      setup() {
        let checked = ref(false)
        watch([checked], () => handleChange(checked.value))
        return { checked }
      },
    })

    // Ensure checkbox is off
    assertSwitch({ state: SwitchState.Off })

    // Toggle
    await click(getSwitch())

    // Ensure state is on
    assertSwitch({ state: SwitchState.On })

    // Toggle
    await click(getSwitch())

    // Ensure state is off
    assertSwitch({ state: SwitchState.Off })
  })

  it('should be possible to toggle the Switch with a click on the Label', async () => {
    let handleChange = jest.fn()
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch v-model="checked" />
          <headlessui-switch-label>The label</headlessui-switch-label>
        </headlessui-switch-group>
      `,
      setup() {
        let checked = ref(false)
        watch([checked], () => handleChange(checked.value))
        return { checked }
      },
    })

    // Ensure checkbox is off
    assertSwitch({ state: SwitchState.Off })

    // Toggle
    await click(getSwitchLabel())

    // Ensure the switch is focused
    assertActiveElement(getSwitch())

    // Ensure state is on
    assertSwitch({ state: SwitchState.On })

    // Toggle
    await click(getSwitchLabel())

    // Ensure the switch is focused
    assertActiveElement(getSwitch())

    // Ensure state is off
    assertSwitch({ state: SwitchState.Off })
  })

  it('should not be possible to toggle the Switch with a click on the Label (passive)', async () => {
    let handleChange = jest.fn()
    renderTemplate({
      template: html`
        <headlessui-switch-group>
          <headlessui-switch v-model="checked" />
          <headlessui-switch-label passive>The label</headlessui-switch-label>
        </headlessui-switch-group>
      `,
      setup() {
        let checked = ref(false)
        watch([checked], () => handleChange(checked.value))
        return { checked }
      },
    })

    // Ensure checkbox is off
    assertSwitch({ state: SwitchState.Off })

    // Toggle
    await click(getSwitchLabel())

    // Ensure state is still Off
    assertSwitch({ state: SwitchState.Off })
  })
})
