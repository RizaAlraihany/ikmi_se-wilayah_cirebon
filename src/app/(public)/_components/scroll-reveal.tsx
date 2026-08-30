'use client'

import { useEffect } from 'react'

/**
 * ScrollReveal - Mengaktifkan animasi scroll reveal dengan debounced observer
 * untuk performa optimal pada React Fast Refresh & Hydration.
 */
export function ScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      },
    )

    const observeElements = () => {
      const elements = document.querySelectorAll(
        '[data-reveal]:not(.revealed), [data-stagger]:not(.revealed)',
      )
      elements.forEach((el) => observer.observe(el))
    }

    // Panggil saat pertama kali mount
    observeElements()

    // Debounce mutation observer agar tidak membebani browser saat render cepat di localhost
    let debounceTimer: NodeJS.Timeout | null = null
    const mutationObserver = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        observeElements()
      }, 100)
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return null
}