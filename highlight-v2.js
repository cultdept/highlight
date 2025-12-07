/* Highlight Travel Engine - Scroll Snap Version */
/* Last updated: 2025-12-07 */

/* ======================================================
   GLOBAL STATE
   ====================================================== */
let activeRegion = null;
let activeState = null;
let activePopulation = null;
let currentActiveSlide = null;

/* ======================================================
   UTILITY FUNCTIONS
   ====================================================== */
function slugToJSONKey(slug) {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function scoreCard(dataNode, activeKeys) {
  if (!dataNode || activeKeys.length === 0) return null;
  
  let criteriaData;
  try {
    criteriaData = JSON.parse(dataNode.getAttribute('data-criteria') || '{}');
  } catch (e) {
    return null;
  }
  
  let total = 0;
  let count = 0;
  
  activeKeys.forEach(key => {
    const value = criteriaData[key];
    if (typeof value === 'number') {
      total += value;
      count++;
    }
  });
  
  return count > 0 ? Math.round(total / count) : null;
}

/* ======================================================
   SCROLL SNAP - ACTIVE SLIDE DETECTION
   ====================================================== */
function initScrollSnap() {
  const container = document.querySelector('.swiper-container');
  if (!container) return;
  
  // Detect which slide is centered
  function updateActiveSlide() {
    const slides = Array.from(document.querySelectorAll('.swiper-slide'));
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    
    let closestSlide = null;
    let closestDistance = Infinity;
    
    slides.forEach(slide => {
      if (slide.style.display === 'none') return;
      
      const slideRect = slide.getBoundingClientRect();
      const slideCenter = slideRect.left + slideRect.width / 2;
      const distance = Math.abs(containerCenter - slideCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSlide = slide;
      }
    });
    
    // Update active class
    if (closestSlide && closestSlide !== currentActiveSlide) {
      slides.forEach(s => s.classList.remove('is-active'));
      closestSlide.classList.add('is-active');
      currentActiveSlide = closestSlide;
      updateActiveSlideDescription();
    }
  }
  
  // Listen for scroll events
  container.addEventListener('scroll', debounce(updateActiveSlide, 50));
  
  // Initial check
  setTimeout(updateActiveSlide, 100);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/* ======================================================
   ARROW NAVIGATION
   ====================================================== */
function initArrowNavigation() {
  const container = document.querySelector('.swiper-container');
  const nextBtn = document.querySelector('.swiper-button-next');
  const prevBtn = document.querySelector('.swiper-button-prev');
  
  if (!container || !nextBtn || !prevBtn) return;
  
  function getVisibleSlides() {
    return Array.from(document.querySelectorAll('.swiper-slide'))
      .filter(s => s.style.display !== 'none');
  }
  
  function scrollToSlide(slide) {
    if (!slide) return;
    
    const containerRect = container.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    
    // Calculate scroll position to center the slide
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const containerCenter = container.offsetWidth / 2;
    const scrollTarget = slideCenter - containerCenter;
    
    container.scrollTo({
      left: scrollTarget,
      behavior: 'smooth'
    });
  }
  
  function goToNext() {
    const slides = getVisibleSlides();
    const currentIndex = slides.indexOf(currentActiveSlide);
    
    if (currentIndex < slides.length - 1) {
      scrollToSlide(slides[currentIndex + 1]);
    }
    updateArrowStates();
  }
  
  function goToPrev() {
    const slides = getVisibleSlides();
    const currentIndex = slides.indexOf(currentActiveSlide);
    
    if (currentIndex > 0) {
      scrollToSlide(slides[currentIndex - 1]);
    }
    updateArrowStates();
  }
  
  function updateArrowStates() {
    const slides = getVisibleSlides();
    const currentIndex = slides.indexOf(currentActiveSlide);
    
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= slides.length - 1;
  }
  
  nextBtn.addEventListener('click', goToNext);
  prevBtn.addEventListener('click', goToPrev);
  
  // Update arrow states when scroll settles
  container.addEventListener('scroll', debounce(updateArrowStates, 100));
  
  // Initial state
  setTimeout(updateArrowStates, 200);
}

/* ======================================================
   FILTERING & SCORING
   ====================================================== */
function updateCardsAndFilter() {
  const pills = Array.from(document.querySelectorAll('.engine-pill.is-active'));
  const activeKeys = pills.map(p => slugToJSONKey(p.getAttribute('data-key')));
  
  const hasCriteria = activeKeys.length > 0;
  const hasTagFilters = activeRegion || activeState || activePopulation;
  const hasAnyFilter = hasCriteria || hasTagFilters;
  
  const slides = Array.from(document.querySelectorAll('.swiper-slide'));
  
  let highestScore = -1;
  let highestSlide = null;
  
  slides.forEach(slide => {
    const dataNode = slide.querySelector('[data-criteria]');
    const scoreBox = slide.querySelector('.slider-score');
    const regionTag = slide.querySelector('.slider-region');
    const stateTag = slide.querySelector('.slider-state-tag');
    const popTag = slide.querySelector('.slider-population');
    
    if (!dataNode || !scoreBox) return;
    
    // Check tag filters
    let matchesRegion = true;
    if (activeRegion && regionTag) {
      matchesRegion = regionTag.textContent.trim() === activeRegion;
    }
    
    let matchesState = true;
    if (activeState && stateTag) {
      matchesState = stateTag.textContent.trim() === activeState;
    }
    
    let matchesPopulation = true;
    if (activePopulation && popTag) {
      matchesPopulation = popTag.textContent.trim() === activePopulation;
    }
    
    const matchesAllFilters = matchesRegion && matchesState && matchesPopulation;
    
    // Calculate score
    const score = scoreCard(dataNode, activeKeys);
    
    // Hide/show based on tag filters
    if (!matchesAllFilters) {
      slide.style.display = 'none';
    } else {
      slide.style.display = '';
      scoreBox.textContent = score == null ? '-' : score;
      
      // Track highest scoring visible slide
      if (score !== null && score > highestScore) {
        highestScore = score;
        highestSlide = slide;
      }
    }
    
    // Add/remove has-criteria class
    if (hasAnyFilter) {
      slide.classList.add('has-criteria');
    } else {
      slide.classList.remove('has-criteria');
    }
  });
  
  // Update description container visibility
  const descContainer = document.querySelector('.engine-active-slide-description');
  if (descContainer) {
    if (hasAnyFilter) {
      descContainer.classList.add('has-criteria');
    } else {
      descContainer.classList.remove('has-criteria');
    }
  }
  
  // Scroll to highest scoring slide
  if (highestSlide) {
    scrollToSlideSmooth(highestSlide);
  } else if (hasTagFilters) {
    // If no scores but we have tag filters, scroll to first visible
    const firstVisible = slides.find(s => s.style.display !== 'none');
    if (firstVisible) {
      scrollToSlideSmooth(firstVisible);
    }
  }
  
  // Update category counts
  updateAllCategoryCounts();
  updateClearAllButton();
}

function scrollToSlideSmooth(slide) {
  const container = document.querySelector('.swiper-container');
  if (!container || !slide) return;
  
  const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
  const containerCenter = container.offsetWidth / 2;
  const scrollTarget = slideCenter - containerCenter;
  
  container.scrollTo({
    left: scrollTarget,
    behavior: 'smooth'
  });
}

/* ======================================================
   ACTIVE SLIDE DESCRIPTION
   ====================================================== */
function updateActiveSlideDescription() {
  if (!currentActiveSlide) return;
  
  const description = currentActiveSlide.querySelector('.slider-description')?.textContent || '';
  const descContainer = document.querySelector('.engine-active-slide-description');
  if (!descContainer) return;
  
  // Find or create content element
  let contentEl = descContainer.querySelector('.slide-description-content.active');
  
  // Fade out existing
  descContainer.querySelectorAll('.slide-description-content').forEach(el => {
    el.classList.remove('active');
  });
  
  // Create new content
  const newContent = document.createElement('div');
  newContent.className = 'slide-description-content';
  newContent.innerHTML = `<p class="slide-description-text">${description}</p>`;
  descContainer.appendChild(newContent);
  
  // Trigger fade in
  requestAnimationFrame(() => {
    newContent.classList.add('active');
  });
  
  // Clean up old content
  setTimeout(() => {
    descContainer.querySelectorAll('.slide-description-content:not(.active)').forEach(el => {
      el.remove();
    });
  }, 300);
}

/* ======================================================
   CRITERIA PILLS
   ====================================================== */
function initCriteriaPills() {
  document.body.addEventListener('click', e => {
    const pill = e.target.closest('.engine-pill');
    if (!pill) return;
    
    pill.classList.toggle('is-active');
    updateCardsAndFilter();
  });
}

/* ======================================================
   PRESET BUTTONS
   ====================================================== */
function initPresetButtons() {
  document.body.addEventListener('click', e => {
    const presetBtn = e.target.closest('.engine-preset-button');
    if (!presetBtn) return;
    
    const presetKeys = presetBtn.getAttribute('data-preset')?.split(',') || [];
    const isActive = presetBtn.classList.contains('is-active');
    
    // Clear all presets first
    document.querySelectorAll('.engine-preset-button').forEach(btn => {
      btn.classList.remove('is-active');
    });
    
    // Clear all pills
    document.querySelectorAll('.engine-pill.is-active').forEach(pill => {
      pill.classList.remove('is-active');
    });
    
    if (!isActive) {
      // Activate this preset
      presetBtn.classList.add('is-active');
      
      // Activate matching pills
      presetKeys.forEach(key => {
        const pill = document.querySelector(`.engine-pill[data-key="${key.trim()}"]`);
        if (pill) pill.classList.add('is-active');
      });
    }
    
    updateCardsAndFilter();
    
    // Auto-close drawer after preset selection
    const drawer = document.querySelector('.engine-criteria-drawer');
    if (drawer) {
      setTimeout(() => {
        drawer.classList.remove('is-open');
      }, 300);
    }
  });
}

/* ======================================================
   TAG CLICK HANDLERS (Region, State, Population)
   ====================================================== */
function initTagClickHandlers() {
  // Region tag click
  document.body.addEventListener('click', e => {
    const regionTag = e.target.closest('.slider-region');
    if (!regionTag) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const clickedRegion = regionTag.textContent.trim();
    
    if (activeRegion === clickedRegion) {
      activeRegion = null;
      document.querySelectorAll('.slider-region.is-active').forEach(r => r.classList.remove('is-active'));
    } else {
      activeRegion = clickedRegion;
      document.querySelectorAll('.slider-region').forEach(r => {
        if (r.textContent.trim() === activeRegion) {
          r.classList.add('is-active');
        } else {
          r.classList.remove('is-active');
        }
      });
    }
    
    updateCardsAndFilter();
  });
  
  // State tag click
  document.body.addEventListener('click', e => {
    const stateTag = e.target.closest('.slider-state-tag');
    if (!stateTag) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const clickedState = stateTag.textContent.trim();
    
    if (activeState === clickedState) {
      activeState = null;
      document.querySelectorAll('.slider-state-tag.is-active').forEach(s => s.classList.remove('is-active'));
    } else {
      activeState = clickedState;
      document.querySelectorAll('.slider-state-tag').forEach(s => {
        if (s.textContent.trim() === activeState) {
          s.classList.add('is-active');
        } else {
          s.classList.remove('is-active');
        }
      });
    }
    
    updateCardsAndFilter();
  });
  
  // Population tag click
  document.body.addEventListener('click', e => {
    const popTag = e.target.closest('.slider-population');
    if (!popTag) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const clickedPop = popTag.textContent.trim();
    
    if (activePopulation === clickedPop) {
      activePopulation = null;
      document.querySelectorAll('.slider-population.is-active').forEach(p => p.classList.remove('is-active'));
    } else {
      activePopulation = clickedPop;
      document.querySelectorAll('.slider-population').forEach(p => {
        if (p.textContent.trim() === activePopulation) {
          p.classList.add('is-active');
        } else {
          p.classList.remove('is-active');
        }
      });
    }
    
    updateCardsAndFilter();
  });
}

/* ======================================================
   CRITERIA DRAWER
   ====================================================== */
function initCriteriaDrawer() {
  const drawer = document.querySelector('.engine-criteria-drawer');
  if (!drawer) return;
  
  // Toggle drawer on click (when closed)
  drawer.addEventListener('click', e => {
    if (!drawer.classList.contains('is-open')) {
      drawer.classList.add('is-open');
    }
  });
  
  // Toggle icon click
  const toggleIcon = drawer.querySelector('.drawer-toggle-icon');
  if (toggleIcon) {
    toggleIcon.addEventListener('click', e => {
      e.stopPropagation();
      drawer.classList.toggle('is-open');
    });
  }
  
  // Clear all button
  const clearAllBtn = drawer.querySelector('.drawer-clear-all');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', e => {
      e.stopPropagation();
      clearAllFilters();
    });
  }
}

function clearAllFilters() {
  // Clear pills
  document.querySelectorAll('.engine-pill.is-active').forEach(pill => {
    pill.classList.remove('is-active');
  });
  
  // Clear presets
  document.querySelectorAll('.engine-preset-button.is-active').forEach(btn => {
    btn.classList.remove('is-active');
  });
  
  // Clear tag filters
  activeRegion = null;
  activeState = null;
  activePopulation = null;
  
  document.querySelectorAll('.slider-region.is-active, .slider-state-tag.is-active, .slider-population.is-active')
    .forEach(tag => tag.classList.remove('is-active'));
  
  updateCardsAndFilter();
}

function updateClearAllButton() {
  const clearBtn = document.querySelector('.drawer-clear-all');
  if (!clearBtn) return;
  
  const hasActivePills = document.querySelectorAll('.engine-pill.is-active').length > 0;
  const hasTagFilters = activeRegion || activeState || activePopulation;
  
  if (hasActivePills || hasTagFilters) {
    clearBtn.classList.add('has-filters');
  } else {
    clearBtn.classList.remove('has-filters');
  }
}

function updateAllCategoryCounts() {
  document.querySelectorAll('.engine-category').forEach(category => {
    const activeCount = category.querySelectorAll('.engine-pill.is-active').length;
    const countBadge = category.querySelector('.category-active-count');
    
    if (countBadge) {
      countBadge.textContent = activeCount;
      if (activeCount > 0) {
        countBadge.classList.add('has-active');
      } else {
        countBadge.classList.remove('has-active');
      }
    }
  });
}

/* ======================================================
   MODAL HANDLING
   ====================================================== */
function initModals() {
  // Card click opens modal
  document.body.addEventListener('click', e => {
    const card = e.target.closest('.swiper-card');
    if (!card) return;
    
    // Don't open if clicking a tag
    if (e.target.closest('.slider-region, .slider-state-tag, .slider-population')) return;
    
    const slide = card.closest('.swiper-slide');
    if (!slide || !slide.classList.contains('is-active')) return;
    if (!slide.classList.contains('has-criteria')) return;
    
    const modal = slide.querySelector('.engine-modal');
    if (modal) {
      openModal(modal);
    }
  });
  
  // Close button
  document.body.addEventListener('click', e => {
    const closeBtn = e.target.closest('.modal-close');
    if (!closeBtn) return;
    
    const modal = closeBtn.closest('.engine-modal');
    if (modal) {
      closeModal(modal);
    }
  });
  
  // Overlay click closes modal
  document.body.addEventListener('click', e => {
    const overlay = e.target.closest('.modal-overlay');
    if (!overlay) return;
    
    const modal = overlay.closest('.engine-modal');
    if (modal) {
      closeModal(modal);
    }
  });
  
  // Escape key closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.engine-modal.is-open');
      if (openModal) {
        closeModal(openModal);
      }
    }
  });
}

function openModal(modal) {
  // Move modal to body to escape any transforms
  document.body.appendChild(modal);
  
  // Update modal score to match card score
  const slide = currentActiveSlide;
  if (slide) {
    const cardScore = slide.querySelector('.slider-score')?.textContent || '-';
    const modalScore = modal.querySelector('.modal-score');
    if (modalScore) {
      modalScore.textContent = cardScore;
    }
  }
  
  // Show modal
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
  });
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  modal.classList.remove('is-open');
  document.body.style.overflow = '';
  
  // Move modal back to slide after animation
  setTimeout(() => {
    if (currentActiveSlide) {
      currentActiveSlide.appendChild(modal);
    }
  }, 300);
}

/* ======================================================
   MAP VIEW TOGGLE
   ====================================================== */
function initMapToggle() {
  const toggle = document.querySelector('.engine-map-toggle');
  const mapWrapper = document.querySelector('.engine-map-wrapper');
  
  if (!toggle || !mapWrapper) return;
  
  toggle.addEventListener('click', () => {
    const isActive = mapWrapper.classList.contains('is-active');
    
    if (isActive) {
      mapWrapper.classList.remove('is-active');
      toggle.innerHTML = '<span class="engine-map-toggle-icon">🗺</span> Map View';
    } else {
      mapWrapper.classList.add('is-active');
      toggle.innerHTML = '<span class="engine-map-toggle-icon">📄</span> List View';
    }
  });
}

/* ======================================================
   INITIALIZATION
   ====================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initScrollSnap();
  initArrowNavigation();
  initCriteriaPills();
  initPresetButtons();
  initTagClickHandlers();
  initCriteriaDrawer();
  initModals();
  initMapToggle();
  
  // Initial state
  updateClearAllButton();
  updateAllCategoryCounts();
  
  console.log('Highlight Travel Engine initialized (Scroll Snap version)');
});
