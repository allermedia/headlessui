import {
  defineComponent,
  inject,
  provide,

  // Types
  InjectionKey,
} from 'vue'
import { render } from '../utils/render'

let ForcePortalRootContext = Symbol('headlessui-force-portal-root-context') as InjectionKey<Boolean>

export function usePortalRoot() {
  return inject(ForcePortalRootContext, false)
}

export let ForcePortalRoot = defineComponent({
  name: 'headlessui-force-portal-root',
  props: {
    as: { type: [Object, String], default: 'template' },
    force: { type: Boolean, default: false },
  },
  setup(props, { slots, attrs }) {
    provide(ForcePortalRootContext, props.force)

    return () => {
      let { force, ...passThroughProps } = props
      return render({
        props: passThroughProps,
        slot: {},
        slots,
        attrs,
        name: 'headlessui-force-portal-root',
      })
    }
  },
})
