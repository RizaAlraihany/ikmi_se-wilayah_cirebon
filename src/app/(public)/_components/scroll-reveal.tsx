'use client'

import { useEffect } from 'react'

/**
 * ScrollReveal — client component yang mengaktifkan animasi scroll reveal
 * untuk semua elemen dengan atribut [data-reveal] dan [data-stagger].
 * Gunakan satu kali di dalam layout atau page.
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
      }
    )

    const observeElements = () => {
      const elements = document.querySelectorAll(
        '[data-reveal]:not(.revealed), [data-stagger]:not(.revealed)'
      )
      elements.forEach((el) => observer.observe(el))
    }

    // Panggil saat mount pertama
    observeElements()

    // Gunakan MutationObserver untuk menangkap elemen yang di-render belakangan (mis. saat navigasi klien atau streaming hydration)
    const mutationObserver = new MutationObserver(() => {
      observeElements()
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return null
}
