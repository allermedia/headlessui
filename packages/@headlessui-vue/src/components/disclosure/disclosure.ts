// WAI-ARIA: https://www.w3.org/TR/wai-aria-practices-1.2/#disclosure
import { defineComponent, ref, provide, inject, InjectionKey, Ref, computed } from 'vue'

import { Keys } from '../../keyboard'
import { match } from '../../utils/match'
import { render, Features } from '../../utils/render'
import { useId } from '../../hooks/use-id'
import { dom } from '../../utils/dom'

enum DisclosureStates {
  Open,
  Closed,
}

interface StateDefinition {
  // State
  disclosureState: Ref<DisclosureStates>
  panelRef: Ref<HTMLElement | null>

  // State mutators
  toggleDisclosure(): void
}

let DisclosureContext = Symbol('headlessui-disclosure-context') as InjectionKey<StateDefinition>

function useDisclosureContext(component: string) {
  let context = inject(DisclosureContext, null)

  if (context === null) {
    let err = new Error(`<${component} /> is missing a parent <headlessui-disclosure /> component.`)
    if (Error.captureStackTrace) Error.captureStackTrace(err, useDisclosureContext)
    throw err
  }

  return context
}

// ---

export let Disclosure = defineComponent({
  name: 'headlessui-disclosure',
  props: {
    as: { type: [Object, String], default: 'template' },
    defaultOpen: { type: [Boolean], default: false },
  },
  setup(props, { slots, attrs }) {
    let disclosureState = ref<StateDefinition['disclosureState']['value']>(
      props.defaultOpen ? DisclosureStates.Open : DisclosureStates.Closed
    )
    let panelRef = ref<StateDefinition['panelRef']['value']>(null)

    let api = {
      disclosureState,
      panelRef,
      toggleDisclosure() {
        disclosureState.value = match(disclosureState.value, {
          [DisclosureStates.Open]: DisclosureStates.Closed,
          [DisclosureStates.Closed]: DisclosureStates.Open,
        })
      },
    } as StateDefinition

    provide(DisclosureContext, api)

    return () => {
      let { defaultOpen: _, ...passThroughProps } = props
      let slot = { open: disclosureState.value === DisclosureStates.Open }
      return render({ props: passThroughProps, slot, slots, attrs, name: 'headlessui-disclosure' })
    }
  },
})

// ---

export let DisclosureButton = defineComponent({
  name: 'headlessui-disclosure-button',
  props: {
    as: { type: [Object, String], default: 'button' },
    disabled: { type: [Boolean], default: false },
  },
  render() {
    let api = useDisclosureContext('headlessui-disclosure-button')

    let slot = { open: api.disclosureState.value === DisclosureStates.Open }
    let propsWeControl = {
      id: this.id,
      type: 'button',
      'aria-expanded': api.disclosureState.value === DisclosureStates.Open ? true : undefined,
      'aria-controls': this.ariaControls,
      onClick: this.handleClick,
      onKeydown: this.handleKeyDown,
      onKeyup: this.handleKeyUp,
    }

    return render({
      props: { ...this.$props, ...propsWeControl },
      slot,
      attrs: this.$attrs,
      slots: this.$slots,
      name: 'headlessui-disclosure-button',
    })
  },
  setup(props) {
    let api = useDisclosureContext('headlessui-disclosure-button')
    let buttonId = `headlessui-disclosure-button-${useId()}`
    let ariaControls = computed(() => dom(api.panelRef)?.id ?? undefined)

    return {
      id: buttonId,
      ariaControls,
      handleClick() {
        if (props.disabled) return
        api.toggleDisclosure()
      },
      handleKeyDown(event: KeyboardEvent) {
        if (props.disabled) return

        switch (event.key) {
          case Keys.Space:
          case Keys.Enter:
            event.preventDefault()
            event.stopPropagation()
            api.toggleDisclosure()
            break
        }
      },
      handleKeyUp(event: KeyboardEvent) {
        switch (event.key) {
          case Keys.Space:
            // Required for firefox, event.preventDefault() in handleKeyDown for
            // the Space key doesn't cancel the handleKeyUp, which in turn
            // triggers a *click*.
            event.preventDefault()
            break
        }
      },
    }
  },
})

// ---

export let DisclosurePanel = defineComponent({
  name: 'headlessui-disclosure-panel',
  props: {
    as: { type: [Object, String], default: 'div' },
    static: { type: Boolean, default: false },
    unmount: { type: Boolean, default: true },
  },
  render() {
    let api = useDisclosureContext('headlessui-disclosure-panel')

    let slot = { open: api.disclosureState.value === DisclosureStates.Open }
    let propsWeControl = { id: this.id, ref: 'el' }

    return render({
      props: { ...this.$props, ...propsWeControl },
      slot,
      attrs: this.$attrs,
      slots: this.$slots,
      features: Features.RenderStrategy | Features.Static,
      visible: slot.open,
      name: 'headlessui-disclosure-panel',
    })
  },
  setup() {
    let api = useDisclosureContext('headlessui-disclosure-panel')
    let panelId = `headlessui-disclosure-panel-${useId()}`

    return { id: panelId, el: api.panelRef }
  },
})
