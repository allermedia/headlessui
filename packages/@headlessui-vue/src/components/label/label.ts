import {
  computed,
  defineComponent,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  unref,

  // Types
  ComputedRef,
  InjectionKey,
} from 'vue'

import { useId } from '../../hooks/use-id'
import { render } from '../../utils/render'

// ---

let LabelContext = Symbol('headlessui-label-context') as InjectionKey<{
  register(value: string): () => void
  slot: Record<string, unknown>
  name: string
  props: Record<string, unknown>
}>

function useLabelContext() {
  let context = inject(LabelContext, null)
  if (context === null) {
    let err = new Error('You used a <headlessui-label /> component, but it is not inside a parent.')
    if (Error.captureStackTrace) Error.captureStackTrace(err, useLabelContext)
    throw err
  }
  return context
}

export function useLabels({
  slot = {},
  name = 'Label',
  props = {},
}: {
  slot?: Record<string, unknown>
  name?: string
  props?: Record<string, unknown>
} = {}): ComputedRef<string | undefined> {
  let labelIds = ref<string[]>([])
  function register(value: string) {
    labelIds.value.push(value)

    return () => {
      let idx = labelIds.value.indexOf(value)
      if (idx === -1) return
      labelIds.value.splice(idx, 1)
    }
  }

  provide(LabelContext, { register, slot, name, props })

  // The actual id's as string or undefined.
  return computed(() => (labelIds.value.length > 0 ? labelIds.value.join(' ') : undefined))
}

// ---

export let Label = defineComponent({
  name: 'headlessui-label',
  props: {
    as: { type: [Object, String], default: 'label' },
    passive: { type: [Boolean], default: false },
  },
  render() {
    let { name = 'headlessui-label', slot = {}, props = {} } = this.context
    let { passive, ...passThroughProps } = this.$props
    let propsWeControl = {
      ...Object.entries(props).reduce(
        (acc, [key, value]) => Object.assign(acc, { [key]: unref(value) }),
        {}
      ),
      id: this.id,
    }
    let allProps = { ...passThroughProps, ...propsWeControl }

    // @ts-expect-error props are dynamic via context, some components will
    //                  provide an onClick then we can delete it.
    if (passive) delete allProps['onClick']

    return render({
      props: allProps,
      slot,
      attrs: this.$attrs,
      slots: this.$slots,
      name,
    })
  },
  setup() {
    let context = useLabelContext()
    let id = `headlessui-label-${useId()}`

    onMounted(() => onUnmounted(context.register(id)))

    return { id, context }
  },
})
