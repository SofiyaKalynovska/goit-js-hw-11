import Axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";


const refs = {
  form: document.querySelector('.search-form'),
  srcBtn: document.querySelector('.search-btn'),
  loadMoreBtn: document.querySelector('.load-more'),
  gallery: document.querySelector('.gallery'),
  guard: document.querySelector('.js-guard')
}

const optionsForObserver = {
  root: null,
  rootMargin: '200px',
  threshold: 1.0
}
const observer = new IntersectionObserver(updateGalleryByScroll,optionsForObserver)


const URL = 'https://pixabay.com/api/';

let page = 1;

let nameForSrc = "";

refs.loadMoreBtn.style.display = 'none';


refs.form.addEventListener('submit', onFormSubmit);
// refs.loadMoreBtn.addEventListener('click', onLoadMorePhotos)
refs.gallery.addEventListener('click', onShowBigPicture)


function onFormSubmit(ev) {
  ev.preventDefault();
  
  // Щоб очистити галерею для нового рендеру після вводу нового запиту:
  clearAll();
  page = 1;
  // Щоб пошук здійснювався на підставі введених користувачем даний до інпуту:
  nameForSrc = ev.currentTarget.elements.searchQuery.value.trim();
  
  // Якщо користувач нічого не ввів або натиснув пробіл:
  if (!nameForSrc) {
    Notiflix.Notify.warning("Searching starts after providing data to search.")
  }
  // Якщо користувач ввів дані для пошуку, звертаємось до бекенду:
    else {
    fetchPhotos(nameForSrc, page);
  }
}


async function fetchPhotos(clientSearchRequest, page = 1) {
  
  try {
    // Параметри пошуку
  const searchParams = new URLSearchParams({
    key: '29607217-805863a5c8e578a841483d4f2',
    q: `${clientSearchRequest}`,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: true,
    page: `${page}`,
    per_page: 40,
  })
    
  // Запит на сервер:
  const gallery = await Axios.get(`${URL}?${searchParams}`)
  const photos = gallery.data;
    
  // Якщо пошук не дав результатів, але інпут заповнений (за даним запитом нічого не знайдено):
  if (photos.hits.length === 0 && nameForSrc !=="" && !(photos.hits.length-1)) {
    Notiflix.Notify.warning("Sorry, there are no images matching your search query. Please try again.");
  }
  // Інформація для клієнта щодо кількості знайених фото, які відповідають введеному запиту:
    else if (page === 1) {
      Notiflix.Notify.success(`Hooray! We found ${photos.totalHits} images.`)
    }

    // Рендер галереї фото з описом:
    onRenderGallery(photos);

  } catch (error) {
    Notiflix.Notify.failure(error);
  }
};


function onRenderGallery(photos) {
  const markup = photos.hits.map((photo) => {
    return `<div class="photo-card">
    <a class="photo-card__item" href="${photo.largeImageURL}">
  <img src="${photo.webformatURL}" alt="${photo.tags}" width="250" height="180" loading="lazy" />
  </a>
  <div class="info">
    <p class="info-item">
      <b>Likes ${photo.likes}</b>
    </p>
    <p class="info-item">
      <b>Views ${photo.views}</b>
    </p>
    <p class="info-item">
      <b>Comments ${photo.comments}</b>
    </p>
    <p class="info-item">
      <b>Downloads ${photo.downloads}</b>
    </p>
  </div>
</div>`
  })
    .join('');
  
    // Додати галеререю в DOM
  refs.gallery.insertAdjacentHTML('beforeend', markup)
  observer.observe(refs.guard)
  
  // Кнопка 'Load more' прихована, якщо фото за запитом менше 40:
  // if (photos.totalHits > 40) {
  //   refs.loadMoreBtn.style.display = 'block';
  // }

  // Кнопка 'Load more' зникає, якщо відображено всі фото, які відповідають запиту:
  if (Number(photos.totalHits / 40) < page && photos.hits.length !== 0) {
    // refs.loadMoreBtn.style.display = 'none';
    Notiflix.Notify.info("We're sorry, but you've reached the end of search results.")
  }
}
 

// При кліку на кнопку 'Load more' відображаються наступні фото з масиву, який отримали від бекенду (не більше 40 позицій) 
// function onLoadMorePhotos() {
//   fetchPhotos(nameForSrc, page += 1);
// }


// Очищення галереї фотографій перед реалізацією наступного пошуку, аби фото з попереднього запиту клієнта не відображались:
function clearAll() {
  page = 1;
  refs.gallery.innerHTML = "";
  // refs.loadMoreBtn.style.display = 'none';
}


// Робота з бібліотекою SimpleLightbox:
function onShowBigPicture(ev) {
  ev.preventDefault();

  if (ev.target.nodeName !== 'IMG') {
    return;
  }

  let galleryOfBigImgs = new SimpleLightbox('.gallery a', {
    captionDelay: 250,
    captionType: 'attr',
    captionsData: 'alt',
    captions: true,
  });
  galleryOfBigImgs.refresh()
}


// Колбек для infinity scroll:
function updateGalleryByScroll(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      fetchPhotos(nameForSrc, page += 1);
    }
  })
}
