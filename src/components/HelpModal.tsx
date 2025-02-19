import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-beforest-earth/30 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-beforest-charcoal/60 hover:text-beforest-charcoal focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-2xl font-arizona-flare text-beforest-earth mb-6">
                      How to Search Images
                    </Dialog.Title>
                    <div className="space-y-6 font-arizona-flare text-beforest-charcoal">
                      <section>
                        <h4 className="text-lg font-semibold mb-2">Text Search</h4>
                        <p className="mb-3">Our search uses CLIP, a powerful AI model that understands both images and text. Here&apos;s how to search effectively:</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>Use simple, descriptive phrases [Good: &quot;sunset over mountains&quot; | Avoid: &quot;beautiful evening with golden rays casting shadows&quot;]</li>
                          <li>Describe clear visual elements [Good: &quot;person in red shirt&quot; | Avoid: &quot;someone wearing clothing&quot;]</li>
                          <li>Mention specific colors and lighting [Good: &quot;foggy morning in forest&quot; | Avoid: &quot;atmospheric woodland scene&quot;]</li>
                          <li>Keep queries short and direct [Good: &quot;lake reflecting pine trees&quot; | Avoid: &quot;serene body of water surrounded by tall evergreen trees in nature&quot;]</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="text-lg font-semibold mb-2">Image Search</h4>
                        <p className="mb-3">Upload any image to find visually similar photos. Best results come from:</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>Clear, well-lit images [Good: Bright daylight shots | Avoid: Dark, blurry images]</li>
                          <li>Simple compositions [Good: Single main subject | Avoid: Busy, cluttered scenes]</li>
                          <li>Similar aspect ratios [Good: Standard landscape/portrait | Avoid: Extreme panoramas]</li>
                        </ul>
                      </section>

                      <section>
                        <h4 className="text-lg font-semibold mb-2">Search Tips</h4>
                        <ul className="list-disc pl-5 space-y-2">
                          <li><span className="font-semibold">Similarity Threshold:</span> Higher values (closer to 90%) find more exact matches, lower values (around 50%) find more varied results</li>
                          <li><span className="font-semibold">Date Range:</span> Combine with search to find seasonal photos [Example: &quot;autumn trees&quot; + date filter for fall months]</li>
                          <li><span className="font-semibold">Refining Results:</span> If results aren&apos;t what you expect, try simpler terms or adjust the similarity slider</li>
                        </ul>
                      </section>

                      <section className="bg-beforest-olive/5 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold mb-2">Example Queries</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-beforest-olive">✓ Effective Queries:</p>
                            <ul className="mt-1 space-y-1 text-sm">
                              <li>&quot;morning fog in forest&quot;</li>
                              <li>&quot;wooden cabin by lake&quot;</li>
                              <li>&quot;autumn trees with sunlight&quot;</li>
                              <li>&quot;snowy mountain peaks&quot;</li>
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-beforest-charcoal/60">✗ Less Effective Queries:</p>
                            <ul className="mt-1 space-y-1 text-sm text-beforest-charcoal/60">
                              <li>&quot;beautiful nature photography with amazing light&quot;</li>
                              <li>&quot;peaceful scene that makes you feel calm&quot;</li>
                              <li>&quot;professional landscape shot with good composition&quot;</li>
                            </ul>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 