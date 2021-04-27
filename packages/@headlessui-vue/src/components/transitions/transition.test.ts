import { defineComponent, ref, onMounted } from 'vue'
import { render, fireEvent } from '../../test-utils/vue-testing-library'

import { suppressConsoleLogs } from '../../test-utils/suppress-console-logs'
import { TransitionRoot, TransitionChild } from './transition'

import { executeTimeline } from '../../test-utils/execute-timeline'
import { html } from '../../test-utils/html'

jest.mock('../../hooks/use-id')

afterAll(() => jest.restoreAllMocks())

function renderTemplate(input: string | Partial<Parameters<typeof defineComponent>[0]>) {
  let defaultComponents = { TransitionRoot, TransitionChild }

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

function getByTestId(id: string) {
  return document.querySelector(`[data-testid="${id}"]`)! as HTMLElement
}

let styles: HTMLElement[] = []
afterEach(() => {
  for (let style of styles.splice(0)) {
    style.parentElement?.removeChild(style)
  }
})

function withStyles(css: string) {
  let style = document.createElement('style')
  style.type = 'text/css'
  style.innerHTML = css
  document.head.appendChild(style)
  styles.push(style)
}

it('should render without crashing', () => {
  renderTemplate({
    template: html`
      <headlessui-transition-root :show="true">
        <div class="hello">Children</div>
      </headlessui-transition-root>
    `,
  })
})

it('should be possible to render a Transition without children', () => {
  renderTemplate({
    template: html`
      <headlessui-transition-root :show="true" class="transition" />
    `,
  })
  expect(document.getElementsByClassName('transition')).not.toBeNull()
})

it(
  'should yell at us when we forget the required show prop',
  suppressConsoleLogs(() => {
    expect.assertions(1)

    renderTemplate({
      template: html`
        <headlessui-transition-root>
          <div class="hello">Children</div>
        </headlessui-transition-root>
      `,
      errorCaptured(err) {
        expect(err as Error).toEqual(
          new Error(
            'A <headlessui-transition /> is used but it is missing a `:show="true | false"` prop.'
          )
        )

        return false
      },
    })
  })
)

describe('Setup API', () => {
  describe('shallow', () => {
    it('should render a div and its children by default', () => {
      let { container } = renderTemplate({
        template: html`
          <headlessui-transition-root :show="true">Children</headlessui-transition-root>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(html`
        <div>
          Children
        </div>
      `)
    })

    it('should passthrough all the props (that we do not use internally)', () => {
      let { container } = renderTemplate({
        template: html`
          <headlessui-transition-root :show="true" id="root" class="text-blue-400">
            Children
          </headlessui-transition-root>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="text-blue-400"
          id="root"
        >
           Children 
        </div>
      `)
    })

    it('should render another component if the `as` prop is used and its children by default', () => {
      let { container } = renderTemplate({
        template: html`
          <headlessui-transition-root :show="true" as="a">
            Children
          </headlessui-transition-root>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <a>
           Children 
        </a>
      `)
    })

    it('should passthrough all the props (that we do not use internally) even when using an `as` prop', () => {
      let { container } = renderTemplate({
        template: html`
          <headlessui-transition-root :show="true" as="a" href="/" class="text-blue-400">
            Children
          </headlessui-transition-root>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <a
          class="text-blue-400"
          href="/"
        >
           Children 
        </a>
      `)
    })

    it('should render nothing when the show prop is false', () => {
      let { container } = renderTemplate({
        template: html`
          <headlessui-transition-root :show="false">Children</headlessui-transition-root>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`<!---->`)
    })

    it('should be possible to change the underlying DOM tag', () => {
      let { container } = renderTemplate({
        template: html`
          <headlessui-transition-root :show="true" as="a">
            Children
          </headlessui-transition-root>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <a>
           Children 
        </a>
      `)
    })
  })

  describe('nested', () => {
    it(
      'should yell at us when we forget to wrap the `<headlessui-transition-child />` in a parent <headlessui-transition /> component',
      suppressConsoleLogs(() => {
        expect.assertions(1)

        renderTemplate({
          template: html`
            <div class="My Page">
              <headlessui-transition-child>Oops</headlessui-transition-child>
            </div>
          `,
          errorCaptured(err) {
            expect(err as Error).toEqual(
              new Error(
                'A <headlessui-transition-child /> is used but it is missing a parent <headlessui-transition-root />.'
              )
            )
            return false
          },
        })
      })
    )

    it('should be possible to render a TransitionChild without children', () => {
      renderTemplate({
        template: html`
          <headlessui-transition-root :show="true">
            <headlessui-transition-child class="transition" />
          </headlessui-transition-root>
        `,
      })
      expect(document.getElementsByClassName('transition')).not.toBeNull()
    })

    it('should be possible to nest transition components', () => {
      let { container } = renderTemplate({
        template: html`
          <div class="My Page">
            <headlessui-transition-root :show="true">
              <headlessui-transition-child>Sidebar</headlessui-transition-child>
              <headlessui-transition-child>Content</headlessui-transition-child>
            </headlessui-transition-root>
          </div>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="My Page"
        >
          <div>
            <div>
              Sidebar
            </div>
            <div>
              Content
            </div>
          </div>
        </div>
      `)
    })

    it('should be possible to change the underlying DOM tag of the TransitionChild components', () => {
      let { container } = renderTemplate({
        template: html`
          <div class="My Page">
            <headlessui-transition-root :show="true">
              <headlessui-transition-child as="aside">Sidebar</headlessui-transition-child>
              <headlessui-transition-child as="section">Content</headlessui-transition-child>
            </headlessui-transition-root>
          </div>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="My Page"
        >
          <div>
            <aside>
              Sidebar
            </aside>
            <section>
              Content
            </section>
          </div>
        </div>
      `)
    })

    it('should be possible to change the underlying DOM tag of the Transition component and TransitionChild components', () => {
      let { container } = renderTemplate({
        template: html`
          <div class="My Page">
            <headlessui-transition-root :show="true" as="article">
              <headlessui-transition-child as="aside">Sidebar</headlessui-transition-child>
              <headlessui-transition-child as="section">Content</headlessui-transition-child>
            </headlessui-transition-root>
          </div>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="My Page"
        >
          <article>
            <aside>
              Sidebar
            </aside>
            <section>
              Content
            </section>
          </article>
        </div>
      `)
    })

    it('should be possible to use render props on the TransitionChild components', () => {
      let { container } = renderTemplate({
        template: html`
          <div class="My Page">
            <headlessui-transition-root :show="true">
              <headlessui-transition-child as="template" v-slot=""
                ><aside>Sidebar</aside></headlessui-transition-child
              >
              <headlessui-transition-child as="template" v-slot=""
                ><section>Content</section></headlessui-transition-child
              >
            </headlessui-transition-root>
          </div>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="My Page"
        >
          <div>
            <aside>
              Sidebar
            </aside>
            <section>
              Content
            </section>
          </div>
        </div>
      `)
    })

    it('should be possible to use render props on the Transition and TransitionChild components', () => {
      let { container } = renderTemplate({
        template: html`
          <div class="My Page">
            <headlessui-transition-root :show="true" as="template">
              <article>
                <headlessui-transition-child as="template" v-slot="">
                  <aside>Sidebar</aside>
                </headlessui-transition-child>
                <headlessui-transition-child as="template" v-slot="">
                  <section>Content</section>
                </headlessui-transition-child>
              </article>
            </headlessui-transition-root>
          </div>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="My Page"
        >
          <article>
            <aside>
              Sidebar
            </aside>
            <section>
              Content
            </section>
          </article>
        </div>
      `)
    })

    it(
      'should yell at us when we forgot to forward the ref on one of the TransitionChild components',
      suppressConsoleLogs(() => {
        expect.hasAssertions()

        let Dummy = defineComponent({
          setup() {
            return () => null
          },
        })

        renderTemplate({
          components: { TransitionRoot, TransitionChild, Dummy },
          template: html`
            <div class="My Page">
              <headlessui-transition-root :show="true">
                <headlessui-transition-child as="template"
                  ><Dummy>Sidebar</Dummy></headlessui-transition-child
                >
                <headlessui-transition-child as="template"
                  ><Dummy>Content</Dummy></headlessui-transition-child
                >
              </headlessui-transition-root>
            </div>
          `,
          errorCaptured(err) {
            expect(err as Error).toEqual(
              new Error('Did you forget to passthrough the `ref` to the actual DOM node?')
            )
            return false
          },
        })
      })
    )
  })

  describe('transition classes', () => {
    it('should be possible to passthrough the transition classes', () => {
      let { container } = renderTemplate({
        components: { TransitionRoot },
        template: html`
          <headlessui-transition-root
            :show="true"
            enter="enter"
            enterFrom="enter-from"
            enterTo="enter-to"
            leave="leave"
            leaveFrom="leave-from"
            leaveTo="leave-to"
          >
            Children
          </headlessui-transition-root>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div>
           Children 
        </div>
      `)
    })

    it('should be possible to passthrough the transition classes and immediately apply the enter transitions when appear is set to true', () => {
      let { container } = renderTemplate({
        template: html`
          <headlessui-transition-root
            :show="true"
            :appear="true"
            enter="enter"
            enterFrom="enter-from"
            enterTo="enter-to"
            leave="leave"
            leaveFrom="leave-from"
            leaveTo="leave-to"
          >
            Children
          </headlessui-transition-root>
        `,
      })

      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="enter enter-from"
        >
           Children 
        </div>
      `)
    })
  })
})

describe('Transitions', () => {
  describe('shallow transitions', () => {
    it('should transition in completely (duration defined in milliseconds)', async () => {
      let enterDuration = 50

      withStyles(`
        .enter { transition-duration: ${enterDuration}ms; }
        .from { opacity: 0%; }
        .to { opacity: 100%; }
      `)

      let Example = defineComponent({
        components: { TransitionRoot },
        template: html`
          <headlessui-transition-root :show="show" enter="enter" enterFrom="from" enterTo="to">
            <span>Hello!</span>
          </headlessui-transition-root>

          <button data-testid="toggle" @click="show = !show">
            Toggle
          </button>
        `,
        setup() {
          let show = ref(false)
          return { show }
        },
      })

      let timeline = await executeTimeline(Example, [
        // Toggle to show
        () => {
          fireEvent.click(getByTestId('toggle'))
          return executeTimeline.fullTransition(enterDuration)
        },
      ])

      expect(timeline).toMatchInlineSnapshot(`
        "Render 1:
            -  <!---->
            +  <div
            +    class=\\"enter from\\"
            +  >
            +    <span>
            +      Hello!
            +    </span>
            +  </div>

        Render 2:
            -  class=\\"enter from\\"
            +  class=\\"enter to\\"

        Render 3: Transition took at least 50ms (yes)
            -  class=\\"enter to\\"
            +  class=\\"\\""
      `)
    })

    it('should transition in completely (duration defined in seconds)', async () => {
      let enterDuration = 50

      withStyles(`
        .enter { transition-duration: ${enterDuration / 1000}s; }
        .from { opacity: 0%; }
        .to { opacity: 100%; }
      `)

      let Example = defineComponent({
        components: { TransitionRoot },
        template: html`
          <headlessui-transition-root :show="show" enter="enter" enterFrom="from" enterTo="to">
            <span>Hello!</span>
          </headlessui-transition-root>

          <button data-testid="toggle" @click="show = !show">
            Toggle
          </button>
        `,
        setup() {
          let show = ref(false)
          return { show }
        },
      })

      let timeline = await executeTimeline(Example, [
        // Toggle to show
        () => {
          fireEvent.click(getByTestId('toggle'))
          return executeTimeline.fullTransition(enterDuration)
        },
      ])

      expect(timeline).toMatchInlineSnapshot(`
        "Render 1:
            -  <!---->
            +  <div
            +    class=\\"enter from\\"
            +  >
            +    <span>
            +      Hello!
            +    </span>
            +  </div>

        Render 2:
            -  class=\\"enter from\\"
            +  class=\\"enter to\\"

        Render 3: Transition took at least 50ms (yes)
            -  class=\\"enter to\\"
            +  class=\\"\\""
      `)
    })

    it('should transition in completely (duration defined in seconds) in (render strategy = hidden)', async () => {
      let enterDuration = 50

      withStyles(`
        .enter { transition-duration: ${enterDuration / 1000}s; }
        .from { opacity: 0%; }
        .to { opacity: 100%; }
      `)

      let Example = defineComponent({
        components: { TransitionRoot },
        template: html`
          <headlessui-transition-root
            :show="show"
            :unmount="false"
            enter="enter"
            enterFrom="from"
            enterTo="to"
          >
            <span>Hello!</span>
          </headlessui-transition-root>

          <button data-testid="toggle" @click="show = !show">
            Toggle
          </button>
        `,
        setup() {
          let show = ref(false)
          return { show }
        },
      })

      let timeline = await executeTimeline(Example, [
        // Toggle to show
        () => {
          fireEvent.click(getByTestId('toggle'))
          return executeTimeline.fullTransition(enterDuration)
        },
      ])

      expect(timeline).toMatchInlineSnapshot(`
        "Render 1:
            -  hidden=\\"\\"
            -  style=\\"display: none;\\"
            +  class=\\"enter from\\"

        Render 2:
            -  class=\\"enter from\\"
            +  class=\\"enter to\\"

        Render 3: Transition took at least 50ms (yes)
            -  class=\\"enter to\\"
            +  class=\\"\\""
      `)
    })

    it('should transition in completely', async () => {
      let enterDuration = 50

      withStyles(`
        .enter { transition-duration: ${enterDuration}ms; }
        .from { opacity: 0%; }
        .to { opacity: 100%; }
      `)

      let Example = defineComponent({
        components: { TransitionRoot },
        template: html`
          <headlessui-transition-root :show="show" enter="enter" enterFrom="from" enterTo="to">
            <span>Hello!</span>
          </headlessui-transition-root>

          <button data-testid="toggle" @click="show = !show">
            Toggle
          </button>
        `,
        setup() {
          let show = ref(false)
          return { show }
        },
      })

      let timeline = await executeTimeline(Example, [
        // Toggle to show
        () => {
          fireEvent.click(getByTestId('toggle'))
          return executeTimeline.fullTransition(enterDuration)
        },
      ])

      expect(timeline).toMatchInlineSnapshot(`
        "Render 1:
            -  <!---->
            +  <div
            +    class=\\"enter from\\"
            +  >
            +    <span>
            +      Hello!
            +    </span>
            +  </div>

        Render 2:
            -  class=\\"enter from\\"
            +  class=\\"enter to\\"

        Render 3: Transition took at least 50ms (yes)
            -  class=\\"enter to\\"
            +  class=\\"\\""
      `)
    })

    it(
      'should transition out completely',
      suppressConsoleLogs(async () => {
        let leaveDuration = 50

        withStyles(`
          .leave { transition-duration: ${leaveDuration}ms; }
          .from { opacity: 0%; }
          .to { opacity: 100%; }
        `)

        let Example = defineComponent({
          components: { TransitionRoot },
          template: html`
            <headlessui-transition-root :show="show" leave="leave" leaveFrom="from" leaveTo="to">
              <span>Hello!</span>
            </headlessui-transition-root>

            <button data-testid="toggle" @click="show = !show">
              Toggle
            </button>
          `,
          setup() {
            let show = ref(true)
            return { show }
          },
        })

        let timeline = await executeTimeline(Example, [
          // Toggle to hide
          () => {
            fireEvent.click(getByTestId('toggle'))
            return executeTimeline.fullTransition(leaveDuration)
          },
        ])

        expect(timeline).toMatchInlineSnapshot(`
          "Render 1:
              -  <div>
              +  <div
              +    class=\\"leave from\\"
              +  >

          Render 2:
              -  class=\\"leave from\\"
              +  class=\\"leave to\\"

          Render 3: Transition took at least 50ms (yes)
              -  <div
              -    class=\\"leave to\\"
              -  >
              -    <span>
              -      Hello!
              -    </span>
              -  </div>
              +  <!---->"
        `)
      })
    )

    it(
      'should transition out completely (render strategy = hidden)',
      suppressConsoleLogs(async () => {
        let leaveDuration = 50

        withStyles(`
          .leave { transition-duration: ${leaveDuration}ms; }
          .from { opacity: 0%; }
          .to { opacity: 100%; }
        `)

        let Example = defineComponent({
          components: { TransitionRoot },
          template: html`
            <headlessui-transition-root
              :show="show"
              :unmount="false"
              leave="leave"
              leaveFrom="from"
              leaveTo="to"
            >
              <span>Hello!</span>
            </headlessui-transition-root>

            <button data-testid="toggle" @click="show = !show">
              Toggle
            </button>
          `,
          setup() {
            let show = ref(true)
            return { show }
          },
        })

        let timeline = await executeTimeline(Example, [
          // Toggle to hide
          () => {
            fireEvent.click(getByTestId('toggle'))
            return executeTimeline.fullTransition(leaveDuration)
          },
        ])

        expect(timeline).toMatchInlineSnapshot(`
          "Render 1:
              -  <div>
              +  <div
              +    class=\\"leave from\\"
              +  >

          Render 2:
              -  class=\\"leave from\\"
              +  class=\\"leave to\\"

          Render 3: Transition took at least 50ms (yes)
              -  class=\\"leave to\\"
              +  class=\\"\\"
              +  hidden=\\"\\"
              +  style=\\"display: none;\\""
        `)
      })
    )

    it(
      'should transition in and out completely',
      suppressConsoleLogs(async () => {
        let enterDuration = 50
        let leaveDuration = 75

        withStyles(`
          .enter { transition-duration: ${enterDuration}ms; }
          .enter-from { opacity: 0%; }
          .enter-to { opacity: 100%; }

          .leave { transition-duration: ${leaveDuration}ms; }
          .leave-from { opacity: 100%; }
          .leave-to { opacity: 0%; }
        `)

        let Example = defineComponent({
          components: { TransitionRoot },
          template: html`
            <headlessui-transition-root
              :show="show"
              enter="enter"
              enterFrom="enter-from"
              enterTo="enter-to"
              leave="leave"
              leaveFrom="leave-from"
              leaveTo="leave-to"
            >
              <span>Hello!</span>
            </headlessui-transition-root>

            <button data-testid="toggle" @click="show = !show">
              Toggle
            </button>
          `,
          setup() {
            let show = ref(false)
            return { show }
          },
        })

        let timeline = await executeTimeline(Example, [
          // Toggle to show
          () => {
            fireEvent.click(getByTestId('toggle'))
            return executeTimeline.fullTransition(enterDuration)
          },

          // Toggle to hide
          () => {
            fireEvent.click(getByTestId('toggle'))
            return executeTimeline.fullTransition(leaveDuration)
          },
        ])

        expect(timeline).toMatchInlineSnapshot(`
          "Render 1:
              -  <!---->
              +  <div
              +    class=\\"enter enter-from\\"
              +  >
              +    <span>
              +      Hello!
              +    </span>
              +  </div>

          Render 2:
              -  class=\\"enter enter-from\\"
              +  class=\\"enter enter-to\\"

          Render 3: Transition took at least 50ms (yes)
              -  class=\\"enter enter-to\\"
              +  class=\\"\\"

          Render 4:
              -  class=\\"\\"
              +  class=\\"leave leave-from\\"

          Render 5:
              -  class=\\"leave leave-from\\"
              +  class=\\"leave leave-to\\"

          Render 6: Transition took at least 75ms (yes)
              -  <div
              -    class=\\"leave leave-to\\"
              -  >
              -    <span>
              -      Hello!
              -    </span>
              -  </div>
              +  <!---->"
        `)
      })
    )

    it(
      'should transition in and out completely (render strategy = hidden)',
      suppressConsoleLogs(async () => {
        let enterDuration = 50
        let leaveDuration = 75

        withStyles(`
          .enter { transition-duration: ${enterDuration}ms; }
          .enter-from { opacity: 0%; }
          .enter-to { opacity: 100%; }

          .leave { transition-duration: ${leaveDuration}ms; }
          .leave-from { opacity: 100%; }
          .leave-to { opacity: 0%; }
        `)

        let Example = defineComponent({
          components: { TransitionRoot },
          template: html`
            <headlessui-transition-root
              :show="show"
              :unmount="false"
              enter="enter"
              enterFrom="enter-from"
              enterTo="enter-to"
              leave="leave"
              leaveFrom="leave-from"
              leaveTo="leave-to"
            >
              <span>Hello!</span>
            </headlessui-transition-root>

            <button data-testid="toggle" @click="show = !show">
              Toggle
            </button>
          `,
          setup() {
            let show = ref(false)
            return { show }
          },
        })

        let timeline = await executeTimeline(Example, [
          // Toggle to show
          () => {
            fireEvent.click(getByTestId('toggle'))
            return executeTimeline.fullTransition(enterDuration)
          },

          // Toggle to hide
          () => {
            fireEvent.click(getByTestId('toggle'))
            return executeTimeline.fullTransition(leaveDuration)
          },

          // Toggle to show
          () => {
            fireEvent.click(getByTestId('toggle'))
            return executeTimeline.fullTransition(leaveDuration)
          },
        ])

        expect(timeline).toMatchInlineSnapshot(`
          "Render 1:
              -  hidden=\\"\\"
              -  style=\\"display: none;\\"
              +  class=\\"enter enter-from\\"

          Render 2:
              -  class=\\"enter enter-from\\"
              +  class=\\"enter enter-to\\"

          Render 3: Transition took at least 50ms (yes)
              -  class=\\"enter enter-to\\"
              +  class=\\"\\"

          Render 4:
              -  class=\\"\\"
              +  class=\\"leave leave-from\\"

          Render 5:
              -  class=\\"leave leave-from\\"
              +  class=\\"leave leave-to\\"

          Render 6: Transition took at least 75ms (yes)
              -  class=\\"leave leave-to\\"
              +  class=\\"\\"
              +  hidden=\\"\\"
              +  style=\\"display: none;\\"

          Render 7:
              -  class=\\"\\"
              -  hidden=\\"\\"
              -  style=\\"display: none;\\"
              +  class=\\"enter enter-from\\"

          Render 8:
              -  class=\\"enter enter-from\\"
              +  class=\\"enter enter-to\\"

          Render 9: Transition took at least 75ms (yes)
              -  class=\\"enter enter-to\\"
              +  class=\\"\\""
        `)
      })
    )
  })

  describe('nested transitions', () => {
    it(
      'should not unmount the whole tree when some children are still transitioning',
      suppressConsoleLogs(async () => {
        let slowLeaveDuration = 150
        let fastLeaveDuration = 50

        withStyles(`
          .leave-slow { transition-duration: ${slowLeaveDuration}ms; }
          .leave-from { opacity: 100%; }
          .leave-to { opacity: 0%; }

          .leave-fast { transition-duration: ${fastLeaveDuration}ms; }
        `)

        let Example = defineComponent({
          components: { TransitionRoot, TransitionChild },
          template: html`
            <headlessui-transition-root :show="show">
              <headlessui-transition-child
                leave="leave-fast"
                leaveFrom="leave-from"
                leaveTo="leave-to"
              >
                I am fast
              </headlessui-transition-child>
              <headlessui-transition-child
                leave="leave-slow"
                leaveFrom="leave-from"
                leaveTo="leave-to"
              >
                I am slow
              </headlessui-transition-child>
            </headlessui-transition-root>

            <button data-testid="toggle" @click="show = !show">
              Toggle
            </button>
          `,
          setup() {
            let show = ref(true)
            return { show }
          },
        })

        let timeline = await executeTimeline(Example, [
          // Toggle to hide
          () => {
            fireEvent.click(getByTestId('toggle'))
            return [
              null, // Initial render
              null, // Setup leave classes
              fastLeaveDuration, // Done with fast leave
              slowLeaveDuration - fastLeaveDuration, // Done with slow leave (which starts at the same time, but it is compaired with previous render snapshot so we have to subtract those)
            ]
          },
        ])

        expect(timeline).toMatchInlineSnapshot(`
          "Render 1:
              -  <div>
              +  <div
              +    class=\\"leave-fast leave-from\\"
              +  >
              ---
              -  <div>
              +  <div
              +    class=\\"leave-slow leave-from\\"
              +  >

          Render 2:
              -  class=\\"leave-fast leave-from\\"
              +  class=\\"leave-fast leave-to\\"
              ---
              -  class=\\"leave-slow leave-from\\"
              +  class=\\"leave-slow leave-to\\"

          Render 3: Transition took at least 50ms (yes)
              -  <div
              -    class=\\"leave-fast leave-to\\"
              -  >
              -     I am fast 
              -  </div>
              +  <!---->

          Render 4: Transition took at least 100ms (yes)
              -  <div>
              ---
              -    <div
              -      class=\\"leave-slow leave-to\\"
              -    >
              -       I am slow 
              -    </div>
              -  </div>"
        `)
      })
    )

    it(
      'should not unmount the whole tree when some children are still transitioning',
      suppressConsoleLogs(async () => {
        let slowLeaveDuration = 150
        let fastLeaveDuration = 50

        withStyles(`
          .leave-slow { transition-duration: ${slowLeaveDuration}ms; }
          .leave-from { opacity: 100%; }
          .leave-to { opacity: 0%; }

          .leave-fast { transition-duration: ${fastLeaveDuration}ms; }
        `)

        let Example = defineComponent({
          components: { TransitionRoot, TransitionChild },
          template: html`
            <headlessui-transition-root :show="show">
              <headlessui-transition-child
                leave="leave-fast"
                leaveFrom="leave-from"
                leaveTo="leave-to"
              >
                <span>I am fast</span>
                <headlessui-transition-root :show="show" leave="leave-slow">
                  I am my own root component and I don't talk to the parent
                </headlessui-transition-root>
              </headlessui-transition-child>
              <headlessui-transition-child
                leave="leave-slow"
                leaveFrom="leave-from"
                leaveTo="leave-to"
              >
                I am slow
              </headlessui-transition-child>
            </headlessui-transition-root>

            <button data-testid="toggle" @click="show = !show">
              Toggle
            </button>
          `,
          setup() {
            let show = ref(true)
            return { show }
          },
        })

        let timeline = await executeTimeline(Example, [
          // Toggle to hide
          () => {
            fireEvent.click(getByTestId('toggle'))
            return [
              null, // Initial render
              null, // Setup leave classes
              fastLeaveDuration, // Done with fast leave
              slowLeaveDuration - fastLeaveDuration, // Done with slow leave (which starts at the same time, but it is compaired with previous render snapshot so we have to subtract those)
            ]
          },
        ])

        expect(timeline).toMatchInlineSnapshot(`
          "Render 1:
              -  <div>
              +  <div
              +    class=\\"leave-fast leave-from\\"
              +  >
              ---
              -    <div>
              +    <div
              +      class=\\"leave-slow\\"
              +    >
              ---
              -  <div>
              +  <div
              +    class=\\"leave-slow leave-from\\"
              +  >

          Render 2:
              -  class=\\"leave-fast leave-from\\"
              +  class=\\"leave-fast leave-to\\"
              ---
              -  class=\\"leave-slow leave-from\\"
              +  class=\\"leave-slow leave-to\\"

          Render 3: Transition took at least 50ms (yes)
              -  <div
              -    class=\\"leave-fast leave-to\\"
              -  >
              -    <span>
              -      I am fast
              -    </span>
              -    <div
              -      class=\\"leave-slow\\"
              -    >
              -       I am my own root component and I don't talk to the parent 
              -    </div>
              -  </div>
              +  <!---->

          Render 4: Transition took at least 100ms (yes)
              -  <div>
              ---
              -    <div
              -      class=\\"leave-slow leave-to\\"
              -    >
              -       I am slow 
              -    </div>
              -  </div>"
        `)
      })
    )
  })
})

describe('Events', () => {
  it(
    'should fire events for all the stages',
    suppressConsoleLogs(async () => {
      let eventHandler = jest.fn()
      let enterDuration = 50
      let leaveDuration = 75

      withStyles(`
        .enter { transition-duration: ${enterDuration}ms; }
        .enter-from { opacity: 0%; }
        .enter-to { opacity: 100%; }

        .leave { transition-duration: ${leaveDuration}ms; }
        .leave-from { opacity: 100%; }
        .leave-to { opacity: 0%; }
      `)

      let Example = defineComponent({
        components: { TransitionRoot },
        template: html`
          <headlessui-transition-root
            :show="show"
            @beforeEnter="eventHandler('beforeEnter', Date.now() - start)"
            @afterEnter="eventHandler('afterEnter', Date.now() - start)"
            @beforeLeave="eventHandler('beforeLeave', Date.now() - start)"
            @afterLeave="eventHandler('afterLeave', Date.now() - start)"
            enter="enter"
            enterFrom="enter-from"
            enterTo="enter-to"
            leave="leave"
            leaveFrom="leave-from"
            leaveTo="leave-to"
          >
            <span>Hello!</span>
          </headlessui-transition-root>

          <button data-testid="toggle" @click="show = !show">
            Toggle
          </button>
        `,
        setup() {
          let show = ref(false)
          let start = ref(Date.now())

          onMounted(() => (start.value = Date.now()))

          return { show, start, eventHandler }
        },
      })

      let timeline = await executeTimeline(Example, [
        // Toggle to show
        () => {
          fireEvent.click(getByTestId('toggle'))
          return executeTimeline.fullTransition(enterDuration)
        },
        // Toggle to hide
        () => {
          fireEvent.click(getByTestId('toggle'))
          return executeTimeline.fullTransition(leaveDuration)
        },
      ])

      expect(timeline).toMatchInlineSnapshot(`
        "Render 1:
            -  <!---->
            +  <div
            +    class=\\"enter enter-from\\"
            +  >
            +    <span>
            +      Hello!
            +    </span>
            +  </div>

        Render 2:
            -  class=\\"enter enter-from\\"
            +  class=\\"enter enter-to\\"

        Render 3: Transition took at least 50ms (yes)
            -  class=\\"enter enter-to\\"
            +  class=\\"\\"

        Render 4:
            -  class=\\"\\"
            +  class=\\"leave leave-from\\"

        Render 5:
            -  class=\\"leave leave-from\\"
            +  class=\\"leave leave-to\\"

        Render 6: Transition took at least 75ms (yes)
            -  <div
            -    class=\\"leave leave-to\\"
            -  >
            -    <span>
            -      Hello!
            -    </span>
            -  </div>
            +  <!---->"
      `)

      expect(eventHandler).toHaveBeenCalledTimes(4)
      expect(eventHandler.mock.calls.map(([name]) => name)).toEqual([
        // Order is important here
        'beforeEnter',
        'afterEnter',
        'beforeLeave',
        'afterLeave',
      ])

      let enterHookDiff = eventHandler.mock.calls[1][1] - eventHandler.mock.calls[0][1]
      expect(enterHookDiff).toBeGreaterThanOrEqual(enterDuration)
      expect(enterHookDiff).toBeLessThanOrEqual(enterDuration * 3)

      let leaveHookDiff = eventHandler.mock.calls[3][1] - eventHandler.mock.calls[2][1]
      expect(leaveHookDiff).toBeGreaterThanOrEqual(leaveDuration)
      expect(leaveHookDiff).toBeLessThanOrEqual(leaveDuration * 3)
    })
  )
})
