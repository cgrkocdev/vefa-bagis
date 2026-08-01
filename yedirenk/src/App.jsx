import React, { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Banknote, BookOpen, Calculator, CalendarDays, Check, CreditCard,
  ChevronDown, ChevronLeft, ChevronRight, CircleUserRound, Droplets, Facebook,
  Globe2, HandHeart, HeartHandshake, Instagram, Landmark, Mail, Menu, Minus,
  LoaderCircle, PackageCheck, Phone, Play, Plus, Search, ShieldCheck, ShoppingBag, Sparkles,
  Target, UsersRound, X, Youtube
} from 'lucide-react';

const slides = [
  { image:'/assets/hero-solidarity-branded-v3.png', tag:'ACİL İNSANİ YARDIM', title:'İyilik, harekete geçtiğinde çoğalır.', text:'Emanetinizi ihtiyaç sahibine doğru zamanda, insan onurunu koruyarak ulaştırıyoruz.', cta:'Acil Yardıma Destek Ol', path:'/bagis?kampanya=acil', color:'#f49e0c' },
  { image:'/assets/hero-water-branded-v3.png', tag:'KALICI ESER', title:'Bir kuyu, bir köyün yarınını değiştirir.', text:'Temiz suya erişimi sağlık, eğitim ve güvenli yaşamın başlangıcı kabul ediyoruz.', cta:'Su Projesini İncele', path:'/calismalarimiz/su', color:'#06b2aa' },
  { image:'/assets/hero-education-branded-v3.png', tag:'EĞİTİM & KÜLTÜR', title:'Her çocuğun hayaline kanat oluyoruz.', text:'Çocukların merakını, özgüvenini ve öğrenme heyecanını güçlendiren programlar kuruyoruz.', cta:'Eğitime Destek Ol', path:'/bagis?kampanya=egitim', color:'#f49e0c' }
];

const campaigns = [
  {slug:'gazze', tag:'Acil Yardım', title:'Gazze Acil Yardım', desc:'Gıda, temiz su, sağlık ve barınma desteği.', price:1000, image:'/assets/program-gaza.jpg', raised:74, icon:HandHeart},
  {slug:'su', tag:'Kalıcı Eser', title:'Su Kuyusu', desc:'Bir topluluğu sürdürülebilir temiz suyla buluşturun.', price:2500, image:'/assets/program-water.jpg', raised:61, icon:Droplets},
  {slug:'yetim', tag:'Çocuk', title:'Yetim Sponsorluğu', desc:'Bir çocuğun eğitim ve gelişimine düzenli destek olun.', price:1200, image:'/assets/program-orphan.jpg', raised:83, icon:UsersRound},
  {slug:'egitim', tag:'Eğitim', title:'Çocuk Akademileri', desc:'Atölye, eğitim seti ve burs desteğine katkı sunun.', price:750, image:'/assets/hero-education-branded-v3.png', raised:48, icon:BookOpen},
  {slug:'saglik', tag:'Sağlık', title:'Katarakt Ameliyatı', desc:'Bir insanın yeniden görmesine vesile olun.', price:3000, image:'/assets/program-cataract.jpg', raised:69, icon:HeartHandshake},
  {slug:'afet', tag:'Afet', title:'Acil Müdahale Fonu', desc:'Afet anında hazır ekip ve malzemeyi güçlendirin.', price:500, image:'/assets/program-emergency.jpg', raised:55, icon:PackageCheck}
];

const workAreas = [
  ['İnsani Yardım','İhtiyacı yerinde tespit eder, emaneti onuru koruyarak ulaştırırız.','/assets/program-humanitarian.jpg','/calismalarimiz/insani-yardim',HandHeart],
  ['Eğitim','Bilgiyi paylaşarak çoğaltır, çocukların geleceğini güçlendiririz.','/assets/hero-education-branded-v3.png','/calismalarimiz/farkindalik',BookOpen],
  ['Su ve Sağlık','Kalıcı su çözümleri ve sağlık programlarıyla yaşamı destekleriz.','/assets/program-water.jpg','/calismalarimiz/su',Droplets],
  ['Afet Yönetimi','Hazırlık, arama kurtarma ve acil yardım kapasitesi oluştururuz.','/assets/program-rescue.jpg','/calismalarimiz/arama-kurtarma',ShieldCheck]
];

const menu = [
  {label:'Biz Kimiz?', path:'/kurumsal/hakkimizda', cols:[
    ['Kurumsal',['Hakkımızda','Tarihçemiz','Misyon & Vizyon','Yönetim']],
    ['İlkelerimiz',['Etik Değerler','Bağışçı Hakları','Şeffaflık','Bilgi Güvenliği']]
  ]},
  {label:'Ne Yapıyoruz?', path:'/calismalarimiz', cols:[
    ['Yardım',['Gazze','İnsani Yardım','Acil Yardım','Yetim']],
    ['Kalıcı Etki',['Su','Katarakt','Eğitim','Arama Kurtarma']]
  ]},
  {label:'Nasıl Katılırsın?', path:'/katil', cols:[
    ['Destek Ol',['Bağış Yap','Sponsor Ol','Su Kuyusu Açtır','Gönüllü Ol']],
    ['Dijital',['Zekât Hesapla','Hesap Numaraları','Bültene Katıl','Yayınlar']]
  ]}
];

const slugMap = {
  'hakkimizda':'Hakkımızda','tarihcemiz':'Tarihçemiz','misyon-vizyon':'Misyon & Vizyon','yonetim':'Yönetim',
  'etik-degerler':'Etik Değerler','bagisci-haklari':'Bağışçı Hakları','seffaflik':'Şeffaflık','bilgi-guvenligi':'Bilgi Güvenliği',
  'filistin-gazze':'Gazze','insani-yardim':'İnsani Yardım','acil-yardim':'Acil Yardım','yetim':'Yetim',
  'su':'Su','katarakt':'Katarakt','farkindalik':'Eğitim','arama-kurtarma':'Arama Kurtarma',
  'sponsor-ol':'Sponsor Ol','su-kuyusu':'Su Kuyusu Açtır','gonullu-ol':'Gönüllü Ol','bulten':'Bültene Katıl',
  'haberler':'Haberler'
};

const pageProfiles = {
  'haberler': {image:'/assets/news-hero-logo-v5.png', lead:'Sahadan doğrulanmış gelişmeler, proje sonuçları, gönüllülük çağrıları ve Yedirenk’ten güncel duyurular.', qas:[
    ['Haber içerikleri nasıl doğrulanıyor?','Saha notları, görsel kayıtlar ve proje sorumlusunun teslim verileri iletişim ekibi tarafından karşılaştırılır. Teyit edilmeyen sayı, konum veya yararlanıcı bilgisi yayımlanmaz.'],
    ['Haberlerde neden bazı kişilerin kimliği gizleniyor?','Çocuk koruma, kişisel güvenlik ve mahremiyet ilkeleri gereği isim, yüz veya konum bilgisi risk oluşturduğunda açık rıza olsa bile içerik anonimleştirilebilir.'],
    ['Basın ve röportaj talepleri nereye iletilir?','Basın, görsel kullanım ve röportaj talepleri iletişim formunda “Basın ve medya” konusu seçilerek iletilebilir. Talep, ilgili program ve iletişim sorumlusuna yönlendirilir.']
  ]},
  'hakkimizda': {image:'/assets/program-volunteer.jpg', lead:'Yedirenk’in kuruluş fikrini, emanet anlayışını ve iyiliği kalıcı etkiye dönüştüren çalışma modelini anlatır.', qas:[
    ['Yedirenk hangi alanlarda çalışır?','Eğitim, kültür, insani yardım, sağlık, temiz su, afet yönetimi ve gönüllülük alanlarında çalışır. Programlar yalnızca yardım ulaştırmayı değil, yerel kapasiteyi güçlendirmeyi ve kalıcı etki üretmeyi hedefler.'],
    ['Yedirenk’in diğer kuruluşlardan farkı nedir?','Her çalışmayı “emanet” yaklaşımıyla ele alır; ihtiyaç sahibinin onurunu, bağışçının iradesini ve kaynağın izlenebilirliğini aynı sürecin ayrılmaz parçaları kabul eder.'],
    ['Faaliyetleri kim denetler?','Projeler yönetim ve mali kontrol süreçlerinden geçer; harcama belgeleri proje kodlarıyla kayıt altına alınır. Dönemsel faaliyet ve mali tablolar şeffaflık sayfasında yayımlanır.']
  ]},
  'tarihcemiz': {image:'/assets/history-logo-v2.png', lead:'Yedirenk’in bir gönüllülük fikrinden kurumsal bir iyilik hareketine uzanan yolculuğu.', qas:[
    ['Yedirenk ne zaman kuruldu?','Derneğin resmî kuruluş ve tescil bilgileri, ilgili kamu kayıtları tamamlandığında tarih ve sicil numarasıyla bu sayfada yayımlanacaktır.'],
    ['Ebabil sembolü neden seçildi?','Ebabil; büyüklüğüyle değil, üstlendiği göreve sadakatiyle anılır. Yedirenk için gayreti, sorumluluğu ve emaneti sahibine ulaştırma bilincini temsil eder.'],
    ['“Yedi renk” neyi ifade eder?','Farklı yaşların, kültürlerin ve imkânların aynı iyilik çatısı altında oluşturduğu zenginliği ve bütünlüğü ifade eder.']
  ]},
  'misyon-vizyon': {image:'/assets/program-awareness.jpg', lead:'İnsan onurunu koruyan yardım, bilgiyi çoğaltan eğitim ve nesilleri buluşturan kültür çalışmaları.', qas:[
    ['Misyon nasıl sahaya yansır?','Her proje ihtiyaç analiziyle başlar, ölçülebilir hedeflerle uygulanır ve teslim kayıtları ile sonuç göstergeleri üzerinden değerlendirilir.'],
    ['Vizyonun zaman hedefi var mı?','Stratejik hedefler yıllık çalışma planlarına ve üç yıllık program dönemlerine ayrılır; gerçekleşmeler dönemsel etki göstergeleriyle izlenir.'],
    ['Başarı neye göre ölçülür?','Yalnızca ulaşılan kişi sayısına değil; erişim sürekliliği, eğitim devamlılığı, sağlık sonucu ve yerel sürdürülebilirlik gibi proje özelindeki göstergelere bakılır.']
  ]},
  'yonetim': {image:'/assets/program-diplomacy.jpg', lead:'Yetki, sorumluluk ve denetimin açık biçimde tanımlandığı katılımcı yönetim yapısı.', qas:[
    ['Yönetim kurulu nasıl belirlenir?','Yönetim kurulu, dernek tüzüğünde belirtilen usule göre genel kurul tarafından belirlenen süre için seçilir. Güncel görev dağılımı resmî süreç tamamlandığında yayımlanır.'],
    ['Çıkar çatışması nasıl önlenir?','Yöneticiler ilgili karar öncesinde çıkar ilişkisini beyan eder; ilişkili işlemlerde oylamaya katılmaz. Satın alma ve ödeme süreçlerinde görevler ayrılığı uygulanır.'],
    ['Gönüllüler karar süreçlerine katılabilir mi?','Program değerlendirme toplantıları, saha geri bildirimleri ve gönüllü çalışma grupları aracılığıyla öneriler kayıt altına alınır ve ilgili komitelere taşınır.']
  ]},
  'etik-degerler': {image:'/assets/program-rights.jpg', lead:'İnsan onuru, tarafsızlık, zarar vermeme, mahremiyet ve hesap verebilirlik ilkeleri.', qas:[
    ['Yardımda ayrımcılık yapılır mı?','Hayır. İhtiyaç değerlendirmesi; dil, din, etnik köken, cinsiyet veya siyasi görüş ayrımı yapılmadan, kırılganlık ve aciliyet ölçütleriyle gerçekleştirilir.'],
    ['Etik ihlal nasıl bildirilir?','İletişim sayfasındaki etik bildirim konusu seçilerek gizli bildirim yapılabilir. Bildirimler operasyon ekibinden bağımsız değerlendirilir ve misillemeye karşı korunur.'],
    ['Fotoğraf ve hikâye paylaşımında izin alınıyor mu?','Evet. Açık rıza, çocuklar için veli onayı ve zarar vermeme ilkesi esastır. Kişinin güvenliğini veya mahremiyetini riske atan içerik yayımlanmaz.']
  ]},
  'bagisci-haklari': {image:'/assets/aid.jpg', lead:'Bağışçının bilgi edinme, tercih belirtme, mahremiyet ve geri bildirim hakları.', qas:[
    ['Bağışım hangi alanda kullanılır?','Bağış sırasında seçtiğiniz kampanya veya fon için kullanılır. İlgili çalışma tamamlanır ya da ihtiyaç ortadan kalkarsa, şartlı bağış kuralları gereği sizin onayınız alınır veya aynı amaca en yakın programa yönlendirme bilgisi paylaşılır.'],
    ['Bağış makbuzuma nasıl ulaşırım?','Çevrim içi bağışın ardından makbuz e-posta adresinize gönderilir. Bağışçı hesabınız aktif olduğunda geçmiş işlemler ve makbuzlar hesabınızdan da indirilebilir.'],
    ['İletişim tercihlerimi değiştirebilir miyim?','Evet. E-posta ve SMS izinlerinizi her iletideki tercih bağlantısından veya iletişim formu üzerinden dilediğiniz zaman güncelleyebilirsiniz.']
  ]},
  'seffaflik': {image:'/assets/program-mavi.jpg', lead:'Kaynağın kabulünden sahadaki teslimine kadar izlenebilir kayıt ve açık raporlama.', qas:[
    ['Çalışmalar nasıl doğrulanır?','İhtiyaç listeleri saha ekibi ve yerel paydaşlarca çapraz kontrol edilir. Satın alma belgeleri, teslim tutanakları, konum kayıtları ve uygun durumlarda yararlanıcı teyitleri aynı proje dosyasında eşleştirilir.'],
    ['Etki raporlarına nasıl ulaşırım?','Yıllık faaliyet raporları “Yayınlar” bölümünde PDF olarak yayımlanır. Kampanya özelindeki sonuç özeti ise proje kapandıktan sonra bağışçılara e-posta ile gönderilir ve ilgili proje sayfasına eklenir.'],
    ['İdari giderler nasıl açıklanır?','Program, kaynak geliştirme ve yönetim giderleri mali tablolarda ayrı başlıklarla gösterilir. Ortak giderler, belgelenmiş ve önceden tanımlanmış dağıtım anahtarlarına göre projelere paylaştırılır.']
  ]},
  'bilgi-guvenligi': {image:'/assets/volunteer.jpg', lead:'Bağışçı, gönüllü ve yararlanıcı verilerini yaşam döngüsü boyunca koruyan güvenlik yaklaşımı.', qas:[
    ['Kart bilgilerim Yedirenk’te saklanır mı?','Hayır. Ödeme altyapısı aktif olduğunda kart verileri PCI DSS uyumlu ödeme kuruluşu tarafından işlenir; Yedirenk sistemlerinde tam kart numarası tutulmaz.'],
    ['Kişisel veriler ne kadar saklanır?','Veriler, ilgili mevzuat ve işleme amacı için gerekli süre boyunca saklanır; süre sonunda güvenli biçimde silinir, yok edilir veya anonimleştirilir.'],
    ['Veri talebimi nasıl iletirim?','Kimliğinizi doğrulayabileceğimiz bir başvuruyu iletişim kanalından KVKK konusu ile iletebilirsiniz. Talep yasal süre içinde veri sorumlusu prosedürüne göre yanıtlanır.']
  ]},
  'filistin-gazze': {image:'/assets/program-gaza.jpg', lead:'Gıda, sağlık, barınma ve eğitim ihtiyaçlarına güvenli erişim koşullarına göre öncelik veriyoruz.', qas:[
    ['Gazze bağışım hangi ihtiyaçta kullanılır?','Bağışınız gıda, içme suyu, sağlık malzemesi veya geçici barınma kalemlerinden sahada doğrulanmış en acil ihtiyaca tahsis edilir. Şartlı bağışlar yalnızca belirtilen kalemde kullanılır.'],
    ['Yardımlar bölgeye nasıl ulaştırılıyor?','Erişim koşullarına göre yerel tedarik, güvenilir uygulama ortakları ve izinli lojistik kanalları birlikte kullanılır. Sevkiyat ve teslim belgeleri proje dosyasında tutulur.'],
    ['Dağıtım güvenliği nasıl sağlanıyor?','Dağıtım noktaları kalabalık ve güvenlik riski değerlendirilerek seçilir; hane listeleri önceden doğrulanır, mümkün olduğunda zaman aralıklı teslim uygulanır.']
  ]},
  'insani-yardim': {image:'/assets/program-humanitarian.jpg', lead:'Emaneti doğru kişiye, doğru zamanda ve insan onurunu koruyan yöntemle ulaştırıyoruz.', qas:[
    ['Yararlanıcılar nasıl belirlenir?','Başvurular hane büyüklüğü, gelir durumu, sağlık, engellilik ve afet etkisi gibi ölçütlerle değerlendirilir; bilgiler saha ziyareti veya güvenilir kurum teyidiyle doğrulanır.'],
    ['Nakdi yardım mı, ayni yardım mı yapılır?','Piyasanın çalıştığı ve güvenli ödeme imkânının bulunduğu yerlerde nakit veya kupon; erişimin sınırlı olduğu durumlarda ayni yardım tercih edilir. Karar, ihtiyaç analizine göre verilir.'],
    ['Aynı haneye mükerrer yardım nasıl önlenir?','Rıza kapsamında tutulan hane kayıtları, proje kodu ve teslim tarihi üzerinden kontrol edilir; yerel koordinasyon mekanizmalarıyla çakışmalar azaltılır.']
  ]},
  'acil-yardim': {image:'/assets/program-emergency.jpg', lead:'Afet ve kriz anlarında hız, güvenlik ve doğru ihtiyaç tespitini birlikte yönetiyoruz.', qas:[
    ['Acil durumda ilk 24 saatte ne yapılır?','Ekip güvenliği ve erişim doğrulanır, hızlı ihtiyaç değerlendirmesi yapılır; temiz su, sıcak yemek, hijyen ve barınma gibi hayat kurtaran kalemler önceliklendirilir.'],
    ['Acil yardım fonu neden önceden toplanır?','İlk müdahalede tedarik ve ulaşım için zaman kaybetmemeyi sağlar. Fon yalnızca doğrulanmış krizlerde, yetkili aktivasyon kararıyla kullanılır.'],
    ['Gönüllüler doğrudan afet bölgesine gidebilir mi?','Hayır. Yalnızca eğitimi, sağlık uygunluğu ve görev ataması tamamlanan gönüllüler koordinasyon içinde sahaya yönlendirilir. Kontrolsüz katılım güvenlik ve lojistik riski doğurur.']
  ]},
  'yetim': {image:'/assets/program-orphan.jpg', lead:'Çocuğun eğitim, sağlık ve sosyal gelişimini aile temelli ve düzenli biçimde destekliyoruz.', qas:[
    ['Sponsorluk yalnızca nakit destek midir?','Hayır. Düzenli katkı; eğitim takibi, temel sağlık ihtiyacı, kırtasiye ve sosyal gelişim programlarını içeren çocuk odaklı destek planına aktarılır.'],
    ['Çocuklarla doğrudan iletişim kurulabilir mi?','Çocuğun korunması ilkeleri nedeniyle kişisel iletişim bilgileri paylaşılmaz. Uygun iletişim ve hediye süreçleri saha ekibinin gözetiminde yürütülür.'],
    ['Sponsorluk ne zaman sona erer?','Yaş, eğitim durumu, aile koşullarındaki değişim veya program ölçütlerine göre düzenli değerlendirme yapılır; sona erme halinde sponsor önceden bilgilendirilir.']
  ]},
  'su': {image:'/assets/hero-water-branded-v3.png', lead:'Temiz suyu sağlık, eğitim ve güvenli yaşamın başlangıcı olarak görüyoruz.', qas:[
    ['Kuyu yeri nasıl seçilir?','Nüfus, mevcut su kaynakları, erişim mesafesi ve zemin koşulları incelenir. Teknik uygunluk, yerel yönetim ve topluluk görüşüyle birlikte değerlendirilir.'],
    ['Suyun içilebilir olduğu nasıl doğrulanır?','Kuyu açıldıktan sonra fiziksel, kimyasal ve mikrobiyolojik su analizi yapılır. Uygun olmayan kaynak teslim edilmez; arıtma veya alternatif nokta değerlendirilir.'],
    ['Kuyunun bakımı kime aittir?','Teslim sırasında yerel su komitesi oluşturulur, temel bakım eğitimi verilir ve sorumlular belirlenir. Periyodik takipte pompa durumu ve su kalitesi kontrol edilir.']
  ]},
  'katarakt': {image:'/assets/program-cataract.jpg', lead:'Muayene, ameliyat ve kontrol sürecini kapsayan bütüncül bir sağlık programı.', qas:[
    ['Hastalar nasıl seçilir?','Yerel sağlık taramalarında görme kaybı tespit edilen kişiler uzman hekimce muayene edilir; ameliyata uygunluk ve tıbbi öncelik hekim kararıyla belirlenir.'],
    ['Bağış ameliyatın hangi giderlerini karşılar?','Program bütçesine göre muayene, cerrahi sarf, göz içi lens, operasyon, ilaç ve ameliyat sonrası kontrol giderlerine katkı sağlar.'],
    ['Ameliyat sonrası takip yapılıyor mu?','Evet. Kontrol tarihi hastaya bildirilir; iyileşme, enfeksiyon riski ve görme sonucu yerel sağlık ekibi tarafından takip edilir.']
  ]},
  'farkindalik': {image:'/assets/hero-education-branded-v3.png', lead:'Bilgiyi davranışa, davranışı ortak iyilik kültürüne dönüştüren eğitim programları.', qas:[
    ['Eğitim içeriklerini kim hazırlıyor?','İçerikler konu uzmanı, eğitimci ve çocuk koruma sorumlusunun katkısıyla hazırlanır; hedef yaş grubuna uygunluk ve anlaşılabilirlik açısından gözden geçirilir.'],
    ['Okullar programa nasıl başvurabilir?','Kurum adı, öğrenci yaş grubu, tahmini katılımcı sayısı ve talep edilen tema iletişim formundan iletilir; takvim ve eğitmen uygunluğuna göre planlama yapılır.'],
    ['Programın etkisi nasıl ölçülür?','Katılım, ön-son değerlendirme, öğretmen gözlemi ve uygun programlarda davranış değişikliği göstergeleri birlikte kullanılır.']
  ]},
  'arama-kurtarma': {image:'/assets/program-rescue.jpg', lead:'Eğitim, disiplin, ekipman ve düzenli tatbikatla afetlere hazırlık kapasitesi kuruyoruz.', qas:[
    ['Ekibe katılmak için deneyim gerekir mi?','Başlangıç seviyesinde deneyim şart değildir; ancak sağlık uygunluğu, temel eğitimlere devam ve ekip disiplinine uzun vadeli bağlılık beklenir.'],
    ['Ekip hangi eğitimleri alır?','Afet bilinci, saha güvenliği, temel ilk yardım, enkaz yaklaşımı, haberleşme, lojistik ve görev seviyesine uygun teknik eğitimler verilir.'],
    ['Ekipmanlar nasıl kontrol edilir?','Her ekipman zimmet ve bakım kaydıyla izlenir; tatbikat öncesi ve sonrası kontrol edilir, üretici periyotlarına göre bakım veya yenileme yapılır.']
  ]},
  'su-kuyusu': {image:'/assets/water-well-logo-v2.png', lead:'Bir kuyudan fazlası: teknik etüt, güvenli su analizi, yerel bakım eğitimi ve uzun vadeli takip.', qas:[
    ['Su kuyusu açtırma süreci nasıl başlar?','Bölge seçimi nüfus, mevcut su kaynağı, yürüme mesafesi ve zemin verileriyle yapılır. Teknik ön inceleme olumluysa proje bütçesi, tahmini süre ve kuyu tipi bağışçıyla paylaşılır.'],
    ['Kuyunun üzerine isim yazılabilir mi?','Yerel mevzuat ve saha güvenliği uygun olduğunda, kurumsal standartlara uygun bir proje plakası hazırlanabilir. Kişisel mesajlar insan onurunu ve yerel hassasiyetleri gözeten kurallara tabidir.'],
    ['Açılıştan sonra kuyu takip ediliyor mu?','Evet. Yerel su komitesi bakım konusunda eğitilir; pompa, drenaj ve su kalitesi belirlenen takip dönemlerinde kontrol edilir. Arıza bildirimleri yerel sorumlu üzerinden kayıt altına alınır.']
  ]}
};

function Logo({light=false}) {
  return <Link to="/" className={`logo ${light?'light':''}`}><img src="/assets/yedirenk-logo-official-pdf.png" alt="Yedirenk Derneği"/></Link>;
}

function Header({cart,onCart}) {
  const [mobile,setMobile]=useState(false), [search,setSearch]=useState(false);
  const nav=useNavigate();
  return <>
    <div className="alertbar"><div className="container"><span><Sparkles/> İyiliğin yedi rengi, tek bir emanette buluşuyor.</span><div><Link to="/hesap-numaralari">Hesap Numaraları</Link><Link to="/zekat-hesapla">Zekât Hesapla</Link><Link to="/iletisim">İletişim</Link><b>TR <ChevronDown/></b></div></div></div>
    <header className="site-header"><div className="container header-inner">
      <Logo/>
      <nav className={mobile?'open':''}>
        {menu.map(m=><div className="nav-group" key={m.label}><Link to={m.path}>{m.label}<ChevronDown/></Link><div className="mega"><div className="mega-brand"><span>EMANETİN İZİNDE</span><h3>{m.label}</h3><p>İyiliği kalıcı etkiye dönüştüren Yedirenk yaklaşımını keşfedin.</p><Link to={m.path}>Tümünü gör <ArrowRight/></Link></div>{m.cols.map(c=><div className="mega-col" key={c[0]}><b>{c[0]}</b>{c[1].map(x=><Link key={x} to={findPath(x)}>{x}<ArrowRight/></Link>)}</div>)}</div></div>)}
        <Link to="/haberler">Haberler</Link><Link to="/projeler">Projeler</Link>
        <button className="mobile-x" onClick={()=>setMobile(false)}><X/></button>
      </nav>
      <div className="header-actions"><button onClick={()=>setSearch(!search)}><Search/></button><Link to="/giris"><CircleUserRound/></Link><button className="basket" onClick={onCart}><ShoppingBag/><i>{cart.reduce((n,x)=>n+x.qty,0)}</i></button><Link className="btn orange" to="/bagis">Bağış Yap <ArrowRight/></Link><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu/></button></div>
    </div>
    {search&&<form className="searchbar" onSubmit={e=>{e.preventDefault();nav('/arama?q='+encodeURIComponent(new FormData(e.currentTarget).get('q')));setSearch(false)}}><div className="container"><Search/><input name="q" autoFocus placeholder="Yedirenk'te ara..."/><button type="button" onClick={()=>setSearch(false)}><X/></button></div></form>}
    </header>
  </>;
}

function findPath(label) {
  const map={'Hakkımızda':'/kurumsal/hakkimizda','Tarihçemiz':'/kurumsal/tarihcemiz','Misyon & Vizyon':'/kurumsal/misyon-vizyon','Yönetim':'/kurumsal/yonetim','Etik Değerler':'/kurumsal/etik-degerler','Bağışçı Hakları':'/kurumsal/bagisci-haklari','Şeffaflık':'/kurumsal/seffaflik','Bilgi Güvenliği':'/kurumsal/bilgi-guvenligi','Gazze':'/calismalarimiz/filistin-gazze','İnsani Yardım':'/calismalarimiz/insani-yardim','Acil Yardım':'/calismalarimiz/acil-yardim','Yetim':'/calismalarimiz/yetim','Su':'/calismalarimiz/su','Katarakt':'/calismalarimiz/katarakt','Eğitim':'/calismalarimiz/farkindalik','Arama Kurtarma':'/calismalarimiz/arama-kurtarma','Bağış Yap':'/bagis','Sponsor Ol':'/katil/sponsor-ol','Su Kuyusu Açtır':'/katil/su-kuyusu','Gönüllü Ol':'/katil/gonullu-ol','Zekât Hesapla':'/zekat-hesapla','Hesap Numaraları':'/hesap-numaralari','Bültene Katıl':'/katil/bulten','Yayınlar':'/yayinlar'}; return map[label]||'/';
}

function Hero() {
  const [active,setActive]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setActive(x=>(x+1)%slides.length),6500);return()=>clearInterval(t)},[]);
  return <section className="hero-slider">{slides.map((s,i)=><article key={s.title} className={i===active?'active':''} style={{backgroundImage:`url(${s.image})`}}><div className="container hero-copy"><span><i style={{background:s.color}}/>{s.tag}</span><h1>{s.title}</h1><p>{s.text}</p><div><Link className="btn orange" to={s.path}>{s.cta}<ArrowRight/></Link></div></div></article>)}
    <div className="slider-controls container"><button onClick={()=>setActive((active+slides.length-1)%slides.length)}><ChevronLeft/></button><div>{slides.map((_,i)=><button className={i===active?'active':''} onClick={()=>setActive(i)} key={i}><span/></button>)}</div><b>0{active+1}<small>/ 0{slides.length}</small></b><button onClick={()=>setActive((active+1)%slides.length)}><ChevronRight/></button></div>
    <div className="quick-donate container"><div><span>HIZLI BAĞIŞ</span><b>Bir iyiliğe şimdi ortak ol</b></div>{campaigns.slice(0,3).map(c=><Link to={`/bagis?kampanya=${c.slug}`} key={c.slug}><c.icon/><span><b>{c.title}</b><small>{c.price.toLocaleString('tr-TR')} ₺’den başlayan</small></span><ArrowRight/></Link>)}</div>
  </section>;
}

function Heading({eyebrow,title,side}) {return <div className="section-head"><div><span>{eyebrow}</span><h2>{title}</h2></div>{side&&<p>{side}</p>}</div>}

function CampaignCard({c,add}) {
  return <article className="campaign-card"><div className="campaign-img"><img src={c.image}/><span>{c.tag}</span><button aria-label="Kampanyayı görüntüle"><ArrowRight/></button></div><div className="campaign-copy"><h3>{c.title}</h3><p>{c.desc}</p><div className="progress"><i style={{width:c.raised+'%'}}/></div><small>Hedefin %{c.raised}’ine ulaşıldı</small><div><b>{c.price.toLocaleString('tr-TR')} ₺</b><button className="btn navy" onClick={()=>add(c)}>Sepete Ekle <Plus/></button></div></div></article>
}

function Home({add}) {
  const [campaignIndex,setCampaignIndex]=useState(0);
  const visible=[0,1,2].map(x=>campaigns[(campaignIndex+x)%campaigns.length]);
  return <main><Hero/>
    <section className="trust-strip"><div className="container">{[[ShieldCheck,'Şeffaflık','Her emanet izlenebilir'],[BadgeCheck,'Güven','Doğrulanmış saha süreçleri'],[Globe2,'Etki','Yerel ve sürdürülebilir'],[PackageCheck,'Raporlama','Sonuç odaklı bildirim']].map(([I,a,b])=><div key={a}><I/><span><b>{a}</b><small>{b}</small></span></div>)}</div></section>
    <section className="section intro-section"><div className="container intro-grid"><div className="brand-orbit"><img src="/assets/yedirenk-mark-transparent.png"/><span>7</span><small>RENK<br/>TEK EMANET</small></div><div><span className="kicker">BİZ KİMİZ?</span><h2>Farklı renkler,<br/><em>aynı iyilikte</em> buluşur.</h2></div><div><p>Yedirenk; insanı, bilgiyi, kültürü, güveni ve yardımlaşmayı birer emanet olarak görür. Gücün büyüklüğüne değil, niyetin samimiyetine inanır.</p><Link className="text-link" to="/kurumsal/hakkimizda">Yedirenk’i yakından tanı <ArrowRight/></Link></div></div></section>
    <section className="section work"><div className="container"><Heading eyebrow="NE YAPIYORUZ?" title={<>İyiliğin her renginde <em>sahadayız.</em></>} side="Acil ihtiyaçtan kalıcı çözüme, insan onurunu merkeze alan programlar geliştiriyoruz."/><div className="work-grid">{workAreas.map(([t,d,img,path,I],i)=><Link to={path} className="work-card" key={t}><img src={img}/><div className="work-shade"/><span>0{i+1}</span><I/><div><h3>{t}</h3><p>{d}</p><b>İncele <ArrowRight/></b></div></Link>)}</div></div></section>
    <section className="section campaign-section"><div className="container"><Heading eyebrow="İYİLİĞE ORTAK OL" title={<>Emanetini <em>iyiliğe dönüştür.</em></>}/><div className="carousel-top"><p>Güncel kampanyalara güvenli ve hızlı biçimde destek olun.</p><div><button onClick={()=>setCampaignIndex((campaignIndex+campaigns.length-1)%campaigns.length)}><ChevronLeft/></button><button onClick={()=>setCampaignIndex((campaignIndex+1)%campaigns.length)}><ChevronRight/></button></div></div><div className="campaign-grid">{visible.map(c=><CampaignCard key={c.slug} c={c} add={add}/>)}</div><Link className="btn outline center-btn" to="/bagis">Tüm bağış alanları <ArrowRight/></Link></div></section>
    <section className="impact"><div className="container impact-grid"><div><span>ETKİMİZ</span><h2>Her iyilik,<br/>bir hayatın <em>rengini değiştirir.</em></h2><Link to="/yayinlar" className="btn white">Etki raporları <ArrowRight/></Link></div><div className="impact-stats">{[['27','Aktif proje'],['18K+','İyiliğe erişen'],['640+','Gönüllü'],['14','Saha noktası']].map(x=><div key={x[1]}><b>{x[0]}</b><span>{x[1]}</span></div>)}</div></div></section>
    <section className="section story"><div className="container story-grid"><div className="story-photo"><img src="/assets/hero-water-branded-v3.png"/><button><Play/></button><span>SAHADAN HİKÂYELER</span></div><div><span className="kicker">BİR KUYU, BİR KÖY</span><h2>“Artık sabahlar <em>okul için.”</em></h2><blockquote>“Suyu uzaktan taşımak yerine dersime hazırlanıyorum. Kuyudan sadece su değil, zaman da akıyor.”</blockquote><p>Kalıcı bir su projesi; çocukların eğitimine, ailelerin sağlığına ve yerel üretime aynı anda dokunur.</p><Link className="text-link" to="/haberler">Hikâyeyi oku <ArrowRight/></Link></div></div></section>
    <section className="section news"><div className="container"><Heading eyebrow="YEDİRENK’TEN" title={<>Haberler ve <em>duyurular.</em></>}/><div className="news-grid">{[['Saha','Yeni dayanışma merkezi hizmete açıldı','/assets/program-humanitarian.jpg'],['Eğitim','Çocuk akademilerinde yaz dönemi başladı','/assets/hero-education-branded-v3.png'],['Su','Yeni kuyumuz 1.200 kişiye temiz su ulaştırıyor','/assets/program-water.jpg']].map((n,i)=><Link to={`/haberler/${i+1}`} key={n[1]}><img src={n[2]}/><div><span>{n[0]}</span><small><CalendarDays/> 2{i+1} Temmuz 2026</small><h3>{n[1]}</h3><b>Haberi oku <ArrowRight/></b></div></Link>)}</div></div></section>
  </main>
}

function Donate({add}) {
  const [category,setCategory]=useState('Tümü');
  const filtered=category==='Tümü'?campaigns:campaigns.filter(c=>c.tag===category);
  return <main><PageHero tag="BAĞIŞ" title="Emanetin iyiliğe dönüşsün." text="Bağış alanını seçin, tutarı belirleyin ve güvenli ödeme adımına ilerleyin." image="/assets/hero-solidarity-branded-v3.png"/><section className="section"><div className="container"><div className="filters">{['Tümü','Acil Yardım','Kalıcı Eser','Çocuk','Eğitim','Sağlık','Afet'].map(x=><button className={x===category?'active':''} onClick={()=>setCategory(x)} key={x}>{x}</button>)}</div><div className="campaign-grid all">{filtered.map(c=><CampaignCard c={c} add={add} key={c.slug}/>)}</div></div></section></main>
}

function NewsPage() {
  const [category,setCategory]=useState('Tümü');
  const items=[
    {category:'Saha',date:'28 Temmuz 2026',title:'Yeni dayanışma merkezi hizmete açıldı',summary:'Yerel gönüllüler ve uzman ekiplerin birlikte yürüteceği merkez; eğitim, sosyal destek ve ihtiyaç yönlendirme çalışmalarına ev sahipliği yapacak.',image:'/assets/program-humanitarian.jpg'},
    {category:'Eğitim',date:'24 Temmuz 2026',title:'Çocuk akademilerinde yaz dönemi başladı',summary:'Bilim, sanat, kültür ve sosyal sorumluluk atölyeleriyle çocukların merakını ve üretme cesaretini destekliyoruz.',image:'/assets/hero-education-branded-v3.png'},
    {category:'Su',date:'21 Temmuz 2026',title:'Yeni kuyumuz 1.200 kişiye temiz su ulaştırıyor',summary:'Su analizi ve bakım eğitimi tamamlanan proje, köyün günlük temiz su ihtiyacını güvenli biçimde karşılamaya başladı.',image:'/assets/program-water.jpg'},
    {category:'Afet',date:'17 Temmuz 2026',title:'Arama kurtarma ekibimiz bölgesel tatbikattaydı',summary:'Saha güvenliği, haberleşme ve ekip koordinasyonu başlıklarında iki gün süren uygulamalı eğitim tamamlandı.',image:'/assets/program-rescue.jpg'},
    {category:'Sağlık',date:'12 Temmuz 2026',title:'Katarakt programında yeni dönem muayeneleri tamamlandı',summary:'Uzman hekim değerlendirmesinden geçen hastalar için ameliyat ve kontrol takvimi oluşturuldu.',image:'/assets/program-cataract.jpg'},
    {category:'Gönüllülük',date:'08 Temmuz 2026',title:'Yeni gönüllülerimiz oryantasyon programında buluştu',summary:'Emanet bilinci, çocuk koruma, saha etiği ve görev güvenliği eğitimlerinin ardından ekip eşleştirmeleri yapıldı.',image:'/assets/program-volunteer.jpg'}
  ];
  const visible=category==='Tümü'?items:items.filter(x=>x.category===category);
  return <main>
    <PageHero tag="YEDİRENK’TEN" title="Haberler ve duyurular" text="Sahadan doğrulanmış gelişmeler, proje sonuçları ve gönüllülük çağrıları." image="/assets/news-hero-logo-v5.png"/>
    <section className="section news-listing"><div className="container">
      <div className="section-head"><div><span>GÜNCEL GELİŞMELER</span><h2>Sahadan <em>doğrulanmış haberler.</em></h2></div><p>Her içerik saha kayıtları, proje sorumlusu bilgileri ve görsel belgeler karşılaştırılarak hazırlanır.</p></div>
      <div className="filters">{['Tümü','Saha','Eğitim','Su','Afet','Sağlık','Gönüllülük'].map(x=><button className={category===x?'active':''} onClick={()=>setCategory(x)} key={x}>{x}</button>)}</div>
      <div className="news-list-grid">{visible.map((n,i)=><article key={n.title} className={i===0&&category==='Tümü'?'featured':''}>
        <Link to={`/haberler/${i+1}`} className="news-list-image"><img src={n.image} alt=""/><span>{n.category}</span></Link>
        <div><small><CalendarDays/> {n.date}</small><h3>{n.title}</h3><p>{n.summary}</p><Link className="text-link" to={`/haberler/${i+1}`}>Haberi oku <ArrowRight/></Link></div>
      </article>)}</div>
    </div></section>
  </main>
}

function NewsDetail() {
  const {id}=useParams();
  const stories={
    '1':{category:'Saha',date:'28 Temmuz 2026',title:'Yeni dayanışma merkezi hizmete açıldı',image:'/assets/program-humanitarian.jpg',lead:'Yerel gönüllüler ve uzman ekiplerin birlikte yürüteceği merkez; eğitim, sosyal destek ve ihtiyaç yönlendirme çalışmalarına ev sahipliği yapacak.'},
    '2':{category:'Eğitim',date:'24 Temmuz 2026',title:'Çocuk akademilerinde yaz dönemi başladı',image:'/assets/hero-education-branded-v3.png',lead:'Bilim, sanat, kültür ve sosyal sorumluluk atölyeleriyle çocukların merakını ve üretme cesaretini destekliyoruz.'},
    '3':{category:'Su',date:'21 Temmuz 2026',title:'Yeni kuyumuz 1.200 kişiye temiz su ulaştırıyor',image:'/assets/program-water.jpg',lead:'Su analizi ve bakım eğitimi tamamlanan proje, köyün günlük temiz su ihtiyacını güvenli biçimde karşılamaya başladı.'}
  };
  const story=stories[id]||stories['1'];
  return <main><PageHero tag={story.category} title={story.title} text={story.lead} image={story.image}/><section className="section article-page"><article className="container"><small><CalendarDays/> {story.date}</small><p className="lead">{story.lead}</p><p>Çalışma öncesinde ihtiyaç, erişim koşulları ve yerel kapasite saha ekibi tarafından değerlendirildi. Uygulama planı, ilgili uzmanlar ve yerel paydaşlarla birlikte oluşturuldu.</p><h2>Süreç kayıt altına alındı</h2><p>Kaynak kullanımı, uygulama adımları ve sonuç göstergeleri proje dosyasında takip edildi. Program ekibi, dönemsel izlemenin ardından elde edilen sonuçları faaliyet raporuna dahil edecek.</p><div className="callout"><ShieldCheck/><div><h3>Doğrulanmış saha bilgisi</h3><p>Bu haber proje sorumlusu kayıtları, saha notları ve görsel belgeler karşılaştırılarak hazırlanmıştır.</p></div></div><Link className="text-link" to="/haberler"><ChevronLeft/> Tüm haberlere dön</Link></article></section></main>
}

function PageHero({tag,title,text,image}) {return <section className="page-hero" style={{backgroundImage:`url(${image||'/assets/hero-solidarity-branded-v3.png'})`}}><div className="container"><span>{tag}</span><h1>{title}</h1><p>{text}</p><div><Link to="/">Ana Sayfa</Link><ChevronRight/>{title}</div></div></section>}

function ContentPage() {
  const loc=useLocation(); const slug=loc.pathname.split('/').filter(Boolean).pop(); const title=slugMap[slug]||'Yedirenk';
  const isWork=loc.pathname.includes('calismalarimiz'); const profile=pageProfiles[slug]||pageProfiles[isWork?'insani-yardim':'hakkimizda']; const img=profile.image;
  return <main><PageHero tag={isWork?'ÇALIŞMA ALANIMIZ':'KURUMSAL'} title={title} text={profile.lead} image={img}/><section className="section detail"><div className="container detail-grid"><aside><b>BU SAYFADA</b>{['Yaklaşımımız','Nasıl çalışıyoruz?','Etki ve şeffaflık','Sık sorulanlar'].map(x=><a href={'#'+x} key={x}>{x}<ArrowRight/></a>)}</aside><article><span className="kicker">YEDİRENK YAKLAŞIMI</span><h2 id="Yaklaşımımız">{title}</h2><p className="lead">{profile.lead} Her uygulama açık sorumluluklar, kayıtlı süreçler ve ölçülebilir sonuçlarla yönetilir.</p><h3 id="Nasıl çalışıyoruz?">Nasıl çalışıyoruz?</h3><div className="steps">{['İhtiyacı dinler ve doğrularız','Çözümü yerel paydaşlarla tasarlarız','Emaneti güvenle ulaştırırız','Sonucu ölçer ve raporlarız'].map((x,i)=><div key={x}><span>0{i+1}</span><b>{x}</b><Check/></div>)}</div><div className="callout" id="Etki ve şeffaflık"><ShieldCheck/><div><h3>Şeffaflık bir seçenek değil, emanetin gereğidir.</h3><p>Kaynakların hangi amaçla ve nasıl kullanıldığını anlaşılır raporlarla paylaşırız.</p></div></div><h3 id="Sık sorulanlar">Sık sorulanlar</h3>{profile.qas.map(([question,answer])=><details key={question}><summary>{question}<Plus/></summary><p>{answer}</p></details>)}</article></div></section></main>
}

function Zakat() {
  const [values,setValues]=useState({altin:0,nakit:0,doviz:0,borc:0});
  const total=Math.max(0,+values.altin + +values.nakit + +values.doviz - +values.borc), zakat=total*.025;
  return <main><PageHero tag="HESAPLAMA ARACI" title="Zekâtını kolayca hesapla." text="Zekâta tabi varlıklarınızı girerek yaklaşık tutarı görün." image="/assets/program-awareness.jpg"/><section className="section"><div className="container calculator"><div><Calculator/><h2>Varlık bilgileri</h2>{[['altin','Altın ve kıymetli madenler'],['nakit','Nakit ve banka varlıkları'],['doviz','Ticari mal ve alacaklar'],['borc','Kısa vadeli borçlar']].map(([k,l])=><label key={k}>{l}<span><input type="number" min="0" value={values[k]} onChange={e=>setValues({...values,[k]:e.target.value})}/> ₺</span></label>)}</div><div className="calc-result"><span>TAHMİNİ ZEKÂT TUTARI</span><b>{zakat.toLocaleString('tr-TR',{maximumFractionDigits:2})} ₺</b><p>Hesaplanan net varlık: {total.toLocaleString('tr-TR')} ₺</p><Link className="btn orange" to="/bagis">Zekâtımı bağışla <ArrowRight/></Link><small>Bu araç bilgilendirme amaçlıdır. Özel durumlarınız için yetkin bir uzmana danışınız.</small></div></div></section></main>
}

function FormPage({kind='İletişim'}) {
  const [sent,setSent]=useState(false);
  const image=kind.includes('Gönüllü')?'/assets/program-volunteer.jpg':kind.includes('İş Birliği')?'/assets/program-diplomacy.jpg':kind.includes('Giriş')?'/assets/program-rights.jpg':'/assets/program-humanitarian.jpg';
  return <main><PageHero tag="BİZE KATIL" title={kind} text="Bilginiz, zamanınız ve gönlünüzle iyiliğin bir parçası olun." image={image}/><section className="section"><div className="container form-layout"><div><span className="kicker">YEDİRENK</span><h2>Birlikte daha <em>fazlası mümkün.</em></h2><p>Formu doldurun, ekibimiz en kısa sürede sizinle iletişime geçsin.</p><ul><li><Check/> Güvenli veri işleme</li><li><Check/> İhtiyaca uygun yönlendirme</li><li><Check/> Hızlı geri dönüş</li></ul></div>{sent?<div className="success"><BadgeCheck/><h3>Başvurunuz alındı.</h3><p>Teşekkür ederiz. Ekibimiz sizinle iletişime geçecek.</p></div>:<form className="contact-form" onSubmit={e=>{e.preventDefault();setSent(true)}}><div><label>Ad Soyad<input required/></label><label>E-posta<input type="email" required/></label></div><div><label>Telefon<input required/></label><label>Konu<select><option>{kind}</option><option>Bağış</option><option>Kurumsal iş birliği</option></select></label></div><label>Mesajınız<textarea rows="5" required/></label><label className="check"><input type="checkbox" required/> Kişisel verilerimin bu başvuru kapsamında işlenmesini kabul ediyorum.</label><button className="btn navy">Gönder <ArrowRight/></button></form>}</div></section></main>
}

function Cart({items,setItems,onClose}) {
  const total=items.reduce((n,x)=>n+x.price*x.qty,0);
  const [checkout,setCheckout]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState('');
  const [form,setForm]=useState({firstName:'',lastName:'',phone:'',email:'',city:'',district:'',cardName:'',cardNumber:'',expiry:'',cvv:'',consent:false,website:''});
  const update=(key,value)=>setForm(current=>({...current,[key]:value}));
  const pay=async event=>{
    event.preventDefault(); setLoading(true); setError('');
    try {
      const base=(import.meta.env.VITE_PANEL_API_URL||import.meta.env.VITE_VEFA_API_URL||'http://localhost:3000').replace(/\/$/,'');
      const response=await fetch(`${base}/api/public/online-donations`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:form.firstName,lastName:form.lastName,phone:form.phone,email:form.email,city:form.city,district:form.district,amount:total,campaign:items.map(item=>`${item.title} (${item.qty} adet)`).join(', '),consent:form.consent,website:form.website})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.message||'Ödeme tamamlanamadı.');
      setReceipt(data.referenceNumber); setItems([]);
    } catch(reason) { setError(reason instanceof Error?reason.message:'Ödeme tamamlanamadı.'); }
    finally { setLoading(false); }
  };
  return <div className="drawer-wrap"><button className="drawer-backdrop" onClick={onClose}/><aside className={`drawer ${checkout?'payment-drawer':''}`}><div className="drawer-head"><div><span>{checkout?'DEMO ÖDEME':'BAĞIŞ SEPETİ'}</span><h3>{checkout?'Güvenli ödeme':'Emanetlerin'}</h3></div><button onClick={onClose}><X/></button></div>{receipt?<div className="payment-success"><BadgeCheck/><span>ÖDEME BAŞARILI</span><h3>Bağışınız için teşekkür ederiz.</h3><p>Demo ödemeniz Yedirenk Derneği yönetim paneline başarıyla aktarıldı.</p><b>Makbuz No: {receipt}</b><button className="btn navy" onClick={onClose}>Tamam</button></div>:checkout?<form className="payment-form" onSubmit={pay}><div className="payment-summary"><span>Ödenecek tutar</span><b>{total.toLocaleString('tr-TR')} ₺</b><small>{items.map(item=>item.title).join(', ')}</small></div>{error&&<p className="payment-error">{error}</p>}<h4>Bağışçı bilgileri</h4><div className="payment-grid"><label>Ad<input required value={form.firstName} onChange={e=>update('firstName',e.target.value)}/></label><label>Soyad<input required value={form.lastName} onChange={e=>update('lastName',e.target.value)}/></label></div><label>Telefon<input required placeholder="05xx xxx xx xx" value={form.phone} onChange={e=>update('phone',e.target.value)}/></label><label>E-posta<input required type="email" placeholder="ornek@eposta.com" value={form.email} onChange={e=>update('email',e.target.value)}/></label><label>Şehir<input value={form.city} onChange={e=>update('city',e.target.value)}/></label><h4>Kart bilgileri <small>Demo</small></h4><label>Kart üzerindeki isim<input required value={form.cardName} onChange={e=>update('cardName',e.target.value)}/></label><label>Kart numarası<div className="card-input"><CreditCard/><input required inputMode="numeric" pattern="[0-9 ]{16,19}" maxLength="19" placeholder="4242 4242 4242 4242" value={form.cardNumber} onChange={e=>update('cardNumber',e.target.value.replace(/[^0-9 ]/g,''))}/></div></label><div className="payment-grid"><label>Son kullanma<input required pattern="[0-9]{2}/[0-9]{2}" placeholder="12/30" value={form.expiry} onChange={e=>update('expiry',e.target.value)}/></label><label>CVV<input required inputMode="numeric" pattern="[0-9]{3}" maxLength="3" placeholder="123" value={form.cvv} onChange={e=>update('cvv',e.target.value.replace(/\D/g,''))}/></label></div><input className="payment-honeypot" tabIndex="-1" autoComplete="off" value={form.website} onChange={e=>update('website',e.target.value)}/><label className="payment-consent"><input type="checkbox" required checked={form.consent} onChange={e=>update('consent',e.target.checked)}/> KVKK aydınlatma metnini okudum ve demo ödeme işlemini onaylıyorum.</label><button disabled={loading} className="btn orange payment-submit">{loading?<><LoaderCircle className="spin"/> İşleniyor...</>:<><ShieldCheck/> {total.toLocaleString('tr-TR')} ₺ Demo Öde</>}</button><small className="demo-note">Bu bir demo ödeme ekranıdır. Kart bilgileriniz kaydedilmez ve gerçek tahsilat yapılmaz.</small><button type="button" className="payment-back" onClick={()=>setCheckout(false)}>Sepete geri dön</button></form>:!items.length?<div className="empty"><ShoppingBag/><h3>Sepetin henüz boş.</h3><p>Bir kampanya seçerek iyiliğe ortak olabilirsin.</p><Link to="/bagis" onClick={onClose} className="btn orange">Kampanyaları gör</Link></div>:<><div className="cart-list">{items.map(x=><div key={x.slug}><img src={x.image}/><div><b>{x.title}</b><span>{x.price.toLocaleString('tr-TR')} ₺</span><div><button onClick={()=>setItems(items.map(i=>i.slug===x.slug?{...i,qty:Math.max(1,i.qty-1)}:i))}><Minus/></button><b>{x.qty}</b><button onClick={()=>setItems(items.map(i=>i.slug===x.slug?{...i,qty:i.qty+1}:i))}><Plus/></button></div></div><button onClick={()=>setItems(items.filter(i=>i.slug!==x.slug))}><X/></button></div>)}</div><div className="cart-total"><span>Toplam bağış</span><b>{total.toLocaleString('tr-TR')} ₺</b><button className="btn orange" onClick={()=>setCheckout(true)}>Güvenli ödemeye geç <ArrowRight/></button><small><ShieldCheck/> Demo güvenli ödeme</small></div></>}</aside></div>
}

function Footer() {
  const [ok,setOk]=useState(false);
  return <><section className="newsletter"><div className="container"><div><Mail/><span><b>İyilikten haberdar ol.</b><small>Saha haberleri ve gönüllülük çağrıları e-postana gelsin.</small></span></div>{ok?<b>Kaydınız alındı, teşekkürler.</b>:<form onSubmit={e=>{e.preventDefault();setOk(true)}}><input type="email" required placeholder="E-posta adresiniz"/><button className="btn orange">Katıl <ArrowRight/></button></form>}</div></section><footer><div className="container footer-grid"><div><Logo light/><p>İnsanı, bilgiyi, kültürü, güveni ve yardımlaşmayı birer emanet biliriz.</p><div className="social"><a><Instagram/></a><a><Facebook/></a><a><Youtube/></a></div></div><div><b>YEDİRENK</b><Link to="/kurumsal/hakkimizda">Hakkımızda</Link><Link to="/kurumsal/seffaflik">Şeffaflık</Link><Link to="/haberler">Haberler</Link><Link to="/iletisim">İletişim</Link></div><div><b>DESTEK OL</b><Link to="/bagis">Bağış Yap</Link><Link to="/katil/gonullu-ol">Gönüllü Ol</Link><Link to="/katil/sponsor-ol">Sponsor Ol</Link><Link to="/zekat-hesapla">Zekât Hesapla</Link></div><div><b>İLETİŞİM</b><span><Phone/> 0 (212) 000 00 00</span><span><Mail/> bilgi@yedirenk.org.tr</span><span><Landmark/> İstanbul, Türkiye</span></div></div><div className="container footer-bottom"><span>© 2026 Yedirenk Derneği. Tüm hakları saklıdır.</span><div><Link to="/kurumsal/bilgi-guvenligi">KVKK</Link><Link to="/kurumsal/etik-degerler">Çerez Politikası</Link></div></div></footer></>
}

export default function App() {
  const [cart,setCart]=useState([]),[drawer,setDrawer]=useState(false); const loc=useLocation();
  useEffect(()=>{ window.scrollTo(0,0); },[loc.pathname]);
  const add=c=>{setCart(x=>x.some(i=>i.slug===c.slug)?x.map(i=>i.slug===c.slug?{...i,qty:i.qty+1}:i):[...x,{...c,qty:1}]);setDrawer(true)};
  return <><Header cart={cart} onCart={()=>setDrawer(true)}/><Routes><Route path="/" element={<Home add={add}/>}/><Route path="/bagis" element={<Donate add={add}/>}/><Route path="/haberler" element={<NewsPage/>}/><Route path="/haberler/:id" element={<NewsDetail/>}/><Route path="/zekat-hesapla" element={<Zakat/>}/><Route path="/iletisim" element={<FormPage kind="İletişim ve Destek"/>}/><Route path="/katil/gonullu-ol" element={<FormPage kind="Gönüllü Başvurusu"/>}/><Route path="/katil/sponsor-ol" element={<FormPage kind="Kurumsal İş Birliği"/>}/><Route path="/giris" element={<FormPage kind="Bağışçı Girişi"/>}/><Route path="*" element={<ContentPage/>}/></Routes><Footer/>{drawer&&<Cart items={cart} setItems={setCart} onClose={()=>setDrawer(false)}/>}</>
}
