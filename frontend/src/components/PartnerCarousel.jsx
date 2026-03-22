import Marquee from "react-fast-marquee";
import Image from "react-bootstrap/Image";

function PartnerCarousel() {
  return (
    <Marquee pauseOnHover={true} speed={60} gradient={false}>
      <a href="https://zsfond.ru">
        <Image
          src={require("shared/image/partners/zolotoesechenie.png")}
          alt='Фонд "Золотое сечение"'
        ></Image>
      </a>
      <a href="https://targem.ru">
        <Image
          src={require("shared/image/partners/targemgames.png")}
          alt="Targem Games "
        ></Image>
      </a>
      <a href="https://sndc.ru">
        <Image
          src={require("shared/image/partners/soundcity.png")}
          alt='Школа музыки "Sound city"'
        ></Image>
      </a>
      <a href="https://fiit-urfu.ru/">
        <Image
          src={require("shared/image/partners/fiit.png")}
          alt="IT-направление ФИИТ в УрФУ"
        ></Image>
      </a>
      <a href="https://smartschoolekb.ru">
        <Image
          src={require("shared/image/partners/smartschool.png")}
          alt="Современная частная школа СМАРТ"
        ></Image>
      </a>
      <a href="https://s-coolbus.ru">
        <Image
          src={require("shared/image/partners/schoolbus.png")}
          alt='ЯЗЫКОВОЙ ЦЕНТР "School bus"'
        ></Image>
      </a>
      <a href="https://mkugmk.ru/ru/about-complex/exhibition-centers/planetariy/">
        <Image
          src={require("shared/image/partners/planetariy.png")}
          alt="Планетарий Екатеринбург"
        ></Image>
      </a>
      <a href="http://gifted.ru">
        <Image
          src={require("shared/image/partners/odarennost.png")}
          alt='Дворец творчества "Одарённость и технологии"'
        ></Image>
      </a>
      <a href="https://www.npoa.ru">
        <Image src={require("shared/image/partners/npo.png")} alt="НПО автоматики "></Image>
      </a>
      <a href="https://ugvim.ru">
        <Image
          src={require("shared/image/partners/muzeivdv.png")}
          alt="Уральский государственный военно-исторический музей"
        ></Image>
      </a>
      <a href="http://молодежь.екатеринбург.рф">
        <Image
          src={require("shared/image/partners/molodeznayapolicy.png")}
          alt="Управление молодёжной политики администрации города Екатеринбурга"
        ></Image>
      </a>
      <a href="https://lotsman.ru">
        <Image
          src={require("shared/image/partners/locman.png")}
          alt='Детская общественная организация "Лоцман"'
        ></Image>
      </a>
      <a href="https://m-i-e.ru/l52">
        <Image
          src={require("shared/image/partners/l52.png")}
          alt="Л52 - Музей истории Екатеринбурга"
        ></Image>
      </a>
      <a href="https://kantrskrip.ru">
        <Image
          src={require("shared/image/partners/kantrscrip.png")}
          alt="Школа астрономии"
        ></Image>
      </a>
      <a href="https://igronaftik.ru">
        <Image
          src={require("shared/image/partners/igronaphtic.png")}
          alt='Мастерская игр "Игронафтик"'
        ></Image>
      </a>
      <a href="https://myatom.ru">
        <Image
          src={require("shared/image/partners/icae.png")}
          alt="Информационные центры по атомной энергии"
        ></Image>
      </a>
      <a href="https://ит-школа.рф/index.html">
        <Image
          src={require("shared/image/partners/homecomputer.png")}
          alt="Школа программирования «Домашний компьютер»"
        ></Image>
      </a>
      <a href="https://vnauku.ru/">
        <Image
          src={require("shared/image/partners/hochuvnauku.png")}
          alt="ФОНД ПОДДЕРЖКИ ИНИЦИАТИВ В СФЕРЕ ДОПОЛНИТЕЛЬНОГО ОБРАЗОВАНИЯ"
        ></Image>
      </a>
      <a href="https://englishdrive.ru">
        <Image
          src={require("shared/image/partners/englishdrive.png")}
          alt='Языковой лагерь "English drive"'
        ></Image>
      </a>
      <a href="https://eklat.jimdofree.com">
        <Image
          src={require("shared/image/partners/ekbclub.png")}
          alt="Екатеринбургкий клуб любителей асрономии и телескопостроения"
        ></Image>
      </a>
      <a href="https://vk.com/cosmoport.club">
        <Image src={require("shared/image/partners/cosmoport.png")} alt="Космопорт"></Image>
      </a>
      <a href="http://айтикуб.рф">
        <Image
          src={require("shared/image/partners/centeritcube.png")}
          alt="ЦЕНТРЫ ЦИФРОВОГО ОБРАЗОВАНИЯ ДЕТЕЙ «IT-КУБ»"
        ></Image>
      </a>
      <a href="http://book.uraic.ru">
        <Image
          src={require("shared/image/partners/bibliotekabelinskogo.png")}
          alt="Библиотека Белинского"
        ></Image>
      </a>
      <a href="https://events.bgekb.ru">
        <Image
          src={require("shared/image/partners/bibliotechniycenter.png")}
          alt='Библиотечный центр "Екатеринбург"'
        ></Image>
      </a>
      <a href="https://екатеринбург.рф">
        <Image
          src={require("shared/image/partners/administration.png")}
          alt="Администрация Екатеринбурга"
        ></Image>
      </a>
      <a href="https://www.4glaza.ru/shops/ekaterinburg/">
        <Image
          src={require("shared/image/partners/4glaza.png")}
          alt='Магазин "4 глаза"'
        ></Image>
      </a>
      <a href="https://baby-club.ru/clubs/ekaterinburg/academic/?utm_source=yandex&utm_medium=map&utm_campaign=ad_mart">
        <Image src={require("shared/image/partners/babyklub.png")} alt="Бэби клуб"></Image>
      </a>
      <a href="https://vk.com/pripev_akadem">
        <Image
          src={require("shared/image/partners/pripev.png")}
          alt='Школа вокала "Припев"'
        ></Image>
      </a>
    </Marquee>
  );
}

export default PartnerCarousel;
