import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-beforest-earth/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center sm:items-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="relative">
                  <Dialog.Title as="h3" className="text-2xl font-arizona-flare text-beforest-earth text-center mb-6">
                    How to Search Images
                  </Dialog.Title>
                  
                  <button
                    onClick={onClose}
                    className="absolute right-0 top-0 p-1 rounded-full hover:bg-beforest-gray/10 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-beforest-charcoal/60" />
                  </button>

                  {/* Text Search Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-arizona-flare text-beforest-olive mb-3">
                      Text Search
                    </h4>
                    <p className="text-sm text-beforest-charcoal/80 mb-4">
                      Our search uses CLIP, a powerful AI model that understands both images and text. Here&apos;s how to search effectively:
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth mb-1">Use simple, descriptive phrases</p>
                          <div className="space-y-1">
                            <p className="text-xs text-beforest-charcoal/70">Good: &quot;sunset over mountains&quot;</p>
                            <p className="text-xs text-red-500/70">Avoid: &quot;beautiful evening with golden rays casting shadows&quot;</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth mb-1">Describe clear visual elements</p>
                          <div className="space-y-1">
                            <p className="text-xs text-beforest-charcoal/70">Good: &quot;person in red shirt&quot;</p>
                            <p className="text-xs text-red-500/70">Avoid: &quot;someone wearing clothing&quot;</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth mb-1">Mention specific colors and lighting</p>
                          <div className="space-y-1">
                            <p className="text-xs text-beforest-charcoal/70">Good: &quot;foggy morning in forest&quot;</p>
                            <p className="text-xs text-red-500/70">Avoid: &quot;atmospheric woodland scene&quot;</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth mb-1">Keep queries short and direct</p>
                          <div className="space-y-1">
                            <p className="text-xs text-beforest-charcoal/70">Good: &quot;lake reflecting pine trees&quot;</p>
                            <p className="text-xs text-red-500/70">Avoid: &quot;serene body of water surrounded by tall evergreen trees in nature&quot;</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth mb-1">Use simple action descriptions</p>
                          <div className="space-y-1">
                            <p className="text-xs text-beforest-charcoal/70">Good: &quot;person climbing tree&quot;</p>
                            <p className="text-xs text-red-500/70">Avoid: &quot;skilled arborist maintaining tall tree&quot;</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth mb-1">Name objects directly</p>
                          <div className="space-y-1">
                            <p className="text-xs text-beforest-charcoal/70">Good: &quot;basket of vegetables&quot;</p>
                            <p className="text-xs text-red-500/70">Avoid: &quot;freshly harvested organic produce&quot;</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth mb-1">Describe the scene simply</p>
                          <div className="space-y-1">
                            <p className="text-xs text-beforest-charcoal/70">Good: &quot;foggy forest morning&quot;</p>
                            <p className="text-xs text-red-500/70">Avoid: &quot;mystical woodland at dawn&quot;</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth mb-1">Keep it short</p>
                          <div className="space-y-1">
                            <p className="text-xs text-beforest-charcoal/70">Good: &quot;people planting trees&quot;</p>
                            <p className="text-xs text-red-500/70">Avoid: &quot;community members working together in garden&quot;</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Search Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-arizona-flare text-beforest-olive mb-3">
                      Image Search
                    </h4>
                    <p className="text-sm text-beforest-charcoal/80 mb-4">
                      Upload any image to find visually similar photos. Best results come from:
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth">Clear, well-lit images</p>
                          <p className="text-xs text-beforest-charcoal/70">Good: Bright daylight shots</p>
                          <p className="text-xs text-red-500/70">Avoid: Dark, blurry images</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth">Simple compositions</p>
                          <p className="text-xs text-beforest-charcoal/70">Good: Single main subject</p>
                          <p className="text-xs text-red-500/70">Avoid: Busy, cluttered scenes</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth">Similar aspect ratios</p>
                          <p className="text-xs text-beforest-charcoal/70">Good: Standard landscape/portrait</p>
                          <p className="text-xs text-red-500/70">Avoid: Extreme panoramas</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search Tips Section */}
                  <div>
                    <h4 className="text-lg font-arizona-flare text-beforest-olive mb-3">
                      Search Tips
                    </h4>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth">Similarity Threshold</p>
                          <p className="text-xs text-beforest-charcoal/70">Higher values (closer to 90%) find more exact matches, lower values (around 50%) find more varied results</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth">Date Range</p>
                          <p className="text-xs text-beforest-charcoal/70">Combine with search to find seasonal photos [Example: &quot;autumn trees&quot; + date filter for fall months]</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1 bg-beforest-olive/20 rounded-full" />
                        <div>
                          <p className="text-sm font-medium text-beforest-earth">Refining Results</p>
                          <p className="text-xs text-beforest-charcoal/70">If results aren&apos;t what you expect, try simpler terms or adjust the similarity slider</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 