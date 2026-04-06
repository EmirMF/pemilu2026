"use client";


import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import GradientBackground from '@/components/GradientBackground';

type AccordionItem = {
  id: number;
  title: string;
  content: string[];
};

const peraturan: AccordionItem[] = [
  {
    id: 1,
    title: 'Ketentuan Bakal Calon General Manager',
    content: [
      'Bakal Calon GM adalah Kru 8EH Radio ITB yang telah mengambil dan mengembalikan berkas pendaftaran secara sadar dan tanpa paksaan.',
      'Minimal telah berkegiatan 1 tahun di 8EH Radio ITB.',
      'Tidak terkena sanksi akademik dari ITB.',
      'Tidak menjabat sebagai Panitia Pemilu 8EH Radio ITB 2026.',
      'Didukung oleh minimal sejumlah 30% kru aktif tiap angkatan kru (29-31) yang dibuktikan dalam bentuk lembar dukungan.',
      'Telah mempersiapkan formatur maksimal 2 orang dan tim sukses maksimal 5 orang.',
    ],
  },
  {
    id: 2,
    title: 'Ketentuan Calon General Manager',
    content: [
      'Calon GM adalah Bakal Calon GM yang telah mengembalikan berkas dan lolos tahap verifikasi.',
      'Calon GM wajib bersungguh-sungguh dalam mengikuti kegiatan Pemilu 8EH Radio ITB, termasuk membantu panitia mengajak massa 8EH Radio ITB untuk berpartisipasi dalam rangkaian acara pemilu.',
      'Calon GM wajib menaati segala peraturan yang telah ditetapkan Panitia Pemilu 8EH Radio ITB 2026.',
      'Calon GM berhak mendapatkan perlakuan secara adil.',
      'Calon GM wajib hadir maksimal 5 menit sebelum rangkaian acara pemilu dimulai.',
    ],
  },
  {
    id: 3,
    title: 'Ketentuan Formatur',
    content: [
      'Formatur berfungsi membantu Calon GM dalam segala hal yang berkaitan dengan pemilu, mulai dari perumusan visi misi hingga pelaksanaan voting.',
      'Formatur diizinkan untuk berdiskusi dengan Calon GM dalam menjawab pertanyaan saat hearing, uji panelis, maupun debat.',
      'Namun, penyampaian jawaban harus tetap dilakukan oleh Calon GM (tidak diwakilkan formatur).',
      'Formatur wajib mengikuti seluruh rangkaian pemilu kecuali atas izin yang dapat diterima oleh Panitia Pemilu 8EH Radio ITB 2026, dan minimal 1 orang formatur hadir pada suatu rangkaian acara.',
      'Formatur wajib sudah aktif menjadi Kru 8EH Radio ITB minimal selama 1 tahun.',
      'Formatur wajib hadir maksimal 5 menit sebelum rangkaian acara pemilu dimulai.',
      'Formatur tidak diperkenankan bertugas sebagai Panitia Pemilu 8EH Radio ITB 2026.',
    ],
  },
  {
    id: 4,
    title: 'Ketentuan Tim Sukses',
    content: [
      'Tim sukses adalah sekelompok orang (Kru 8EH Radio ITB) berjumlah minimal 2 orang dan maksimal 5 orang untuk membantu Calon GM dalam menyebarkan pensuasanaan pada masa kampanye.',
      'Tim sukses harus terdiri dari setidaknya satu kru dari setiap angkatan yang memberikan dukungan pada lembar dukungan.',
      'Tim sukses tidak diperkenankan bertugas sebagai Panitia Pemilu 8EH Radio ITB 2026.',
      'Tim sukses bukan merupakan Management Board 8EH Periode 2026/2026.',
      'Tim sukses hanya memiliki hak membantu pensuasanaan, seperti menyebarkan materi kampanye, mengajak massa menghadiri hearing dan uji panelis, serta meminta massa 8EH Radio ITB mengisi lembar dukungan.',
    ],
  },
  {
    id: 5,
    title: 'Ketentuan Berkas',
    content: [
      'Setiap Bakal Calon GM wajib mengumpulkan berkas-berkas pendaftaran kepada Panitia Pemilu 8EH Radio ITB 2026 dengan ketentuan sebagai berikut:',
      '• Curriculum vitae',
      '• Surat pernyataan calon General Manager',
      '• Surat pernyataan izin orang tua Calon General Manager',
      '• Motivation letter dengan tema "Tentang Aku dan 8EH"',
      '• Lembar dukungan minimal dari 30% Kru aktif dari anggota tiap angkatan kru',
      '• Lembar identitas formatur',
      '• Lembar identitas tim sukses',
      '• Scan Kartu Tanda Mahasiswa (KTM)',
      '• Scan Kartu Tanda Penduduk (KTP)',
      '• Scan sertifikat prestasi (jika ada)',
      'Bakal Calon GM baru yang ingin mengambil berkas harap menghubungi Contact Person Pemilu 8EH Radio ITB 2026 terlebih dahulu (Claudine - Kru 30).',
      'Bakal Calon GM baru yang mengambil berkas harus membayar uang deposit sebesar Rp100.000,00 yang akan dikembalikan pada masa voting setelah dikurangi denda (bila ada).',
      'Pelanggaran yang dilakukan Calon GM akan menyebabkan pemotongan yang deposit sesuai denda yang telah ditetapkan.',
      'Bakal Calon GM baru yang tidak mengembalikan berkas, tidak akan dikembalikan uang depositnya.',
    ],
  },
  {
    id: 6,
    title: 'Ketentuan Kampanye',
    content: [
      'Kampanye digunakan untuk menyebarkan informasi yang berkaitan dengan Calon GM.',
      'Masa kampanye dilaksanakan pada 17 Maret - 9 April 2026.',
      'Kampanye dapat dilakukan melalui media apapun dan dalam bentuk apapun (infografis, video, poster, dan sebagainya).',
      'Sebelum melakukan kegiatan kampanye, Calon GM atau tim sukses harus mengabari Koordinator Pemilu (Claudine- Kru 30) H-1 sebelum kegiatan dilaksanakan.',
      'Segala media kampanye wajib dihapus saat masa tenang (kecuali kampanye berupa pesan di Bukomline, tidak perlu di-unsend, namun dilarang melakukan follow up atau membalas pesan tersebut).',
      'Konten kampanye dilarang mengandung unsur SARA atau menjatuhkan Calon GM lainnya.',
      'Apabila Kru menemukan pelanggaran, dapat dilaporkan ke panitia untuk ditindaklanjuti.',
    ],
  },
  {
    id: 7,
    title: 'Ketentuan Kuorum',
    content: [
      'Kuota forum untuk tiap angkatan menghadiri hearing dan uji panelis yaitu: Kru 31 sebesar 90% Kru aktif (66 orang), Kru 30 sebesar 50% Kru aktif (40 orang), dan Kru 29 sebesar 30% Kru aktif (11 orang).',
      'Apabila kuota forum belum terpenuhi, maka akan diberikan waktu tunggu 30 menit.',
      'Jika kuota forum masih belum terpenuhi setelah waktu tunggu habis, maka perwakilan angkatan Kru 8EH Radio ITB yang gagal memenuhi kuota harus membuat video permintaan maaf bagi angkatan kru yang memenuhi kuorum.',
      'Video harus dikirim ke Bukomline 8EH maksimal H+2 keberjalanan forum.',
      'Gagalnya pemenuhan kuota forum akan mengakibatkan adanya pengurangan poin bagi seluruh calon GM.',
    ],
  },
  {
    id: 8,
    title: 'Ketentuan Hearing',
    content: [
      'Calon GM wajib melakukan presentasi mengenai perkenalan diri, pemaparan visi dan misi, serta pemaparan struktur dan elemen lain yang berkaitan dengan gagasan fungsional General Manager di 8EH Radio ITB pada tahun kepengurusan berikutnya.',
      'Dokumen yang akan dipaparkan saat hearing wajib diserahkan kepada Panitia Pemilu 8EH Radio ITB 2026 maksimal H-2 pelaksanaan hearing melalui media Google Drive.',
    ],
  },
  {
    id: 9,
    title: 'Ketentuan Uji Panelis',
    content: [
      'Uji panelis diadakan untuk membantu massa 8EH Radio ITB dalam mengenal lebih lanjut para calon GM, khususnya mengenai wawasan tentang 8EH dan kredibilitas calon GM.',
      'Uji panelis dilakukan dengan studi kasus dan debat Calon GM jika calon lebih dari 1.',
      'Topik studi kasus terdiri atas Kepemimpinan, Manajemen & Pengembangan Anggota, Wawasan Keorganisasian 8EH Radio ITB, Product and Service Development 8EH Radio ITB, dan 8EH Radio ITB sebagai Media.',
      'Panelis akan memberikan penilaian kepada Calon GM dan hasil nilai tersebut dapat digunakan oleh Calon GM untuk mengevaluasi kembali gagasannya untuk 8EH.',
      'Jika ada perubahan dalam perjalanannya, panitia akan memberitahukan kepada calon GM dan kru melalui grup Bukomline 8EH.',
    ],
  },
  {
    id: 10,
    title: 'Ketentuan Debat',
    content: [
      'Debat Calon GM hanya dilakukan bila Calon GM tidak calon tunggal.',
      'Debat Calon GM diawali dengan para calon memberikan pandangannya terhadap topik-topik yang sudah ditentukan sebelumnya.',
      'Topik yang akan dibawakan adalah Lingkungan Organisasi 8EH, Potensi Kru 8EH, Profesionalitas dan Kekeluargaan Kru 8EH, 8EH sebagai Media, dan Kaderisasi dan Jenjangnya.',
      'Pada sesi berikutnya, panelis dan kru akan memberikan bahan/case yang akan didebatkan oleh para calon.',
      'Di sesi ketiga para Calon GM akan saling melemparkan pertanyaan untuk satu sama lain terkait topik-topik yang sudah ditentukan sebelumnya.',
    ],
  },
  {
    id: 11,
    title: 'Ketentuan Hak Suara',
    content: [
      'Setiap Kru aktif maupun Kru tidak aktif memiliki hak suara jika mengikuti minimal 1 dari 3 rangkaian acara pemilu serta memenuhi minimal akumulasi 2 jam waktu kehadiran pada rangkaian acara pemilu atau mendapat rata-rata nilai kuis lebih dari atau sama dengan 7 pada kedua kuis forum pemilu (hearing dan uji panelis).',
      'Seluruh panitia pemilu yang tercantum dalam organorgam berhak memilih dan tidak boleh menunjukkan keberpihakan pada calon yang ada.',
    ],
  },
  {
    id: 12,
    title: 'Sanksi dan Pelanggaran',
    content: [
      'KEHADIRAN: Tim formatur tidak menghadiri kegiatan yang diselenggarakan Panitia Pemilu 8EH Radio ITB 2026 tanpa izin yang jelas dikenakan sanksi -10 poin.',
      'KETERLAMBATAN: Calon General Manager dan/atau tim formatur terlambat dikenakan sanksi -10 poin.',
      'KETERLAMBATAN: Calon General Manager dan/atau tim formatur tidak memberikan izin terlambat akan diberikan 15 poin.',
      'HEARING: Terlambat mengumpulkan dokumen hearing dari waktu yang ditentukan dikenakan sanksi -20 poin.',
      'UJI PANELIS: Berdiskusi dengan pihak selain tim formatur dikenakan sanksi -25 poin.',
      'LAINNYA: Melakukan tindakan berupa merendahkan calon, menyampaikan hal berbau SARA, hinaan, pornografi, dan pencemaran nama baik dalam suasana dan lingkungan pemilu dikenakan sanksi -50 poin.',
      'LAINNYA: Melakukan tindakan pengancaman, kekerasan, mengadu domba, dan penyuapan berupa uang kepada pihak mana pun dalam rangkaian pemilu dikenakan sanksi -100 poin.',
      'LAINNYA: Terbukti memalsukan berkas Calon General Manager dikenakan sanksi -100 poin.',
      'LAINNYA: Angka kuota forum kesepakatan tidak terpenuhi dikenakan sanksi -20 poin.',
    ],
  },
];

export default function PeraturanPage() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);

  }, []);

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  if (!mounted) {
    return (
      <main className="min-h-screen relative">
        <GradientBackground />
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24 relative z-10">
          <div className="text-center text-gray-900">Memuat...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative" suppressHydrationWarning>
      <GradientBackground />
      <Navbar />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-24 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center my-24"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">Peraturan</h1>
          <p className="text-xl text-neutral-700 dark:text-neutral-300">Pemilu General Manager 8EH Radio ITB 2026</p>
        </motion.div>

        {/* Accordion */}
        <div className="space-y-4">
          {peraturan.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-primary-200 dark:border-neutral-700 shadow-lg overflow-hidden">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-cream-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center">
                      <span className="text-secondary-600 dark:text-secondary-400 font-bold">{item.id}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 text-left">
                      {item.title}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: openId === item.id ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown size={24} className="text-neutral-600 dark:text-neutral-400" />
                  </motion.div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence>
                  {openId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-primary-100 dark:border-neutral-700">
                        <ul className="space-y-3">
                          {item.content.map((rule, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle2
                                size={20}
                                className="text-secondary-500 dark:text-secondary-400 flex-shrink-0 mt-0.5"
                              />
                              <span className="text-neutral-700 dark:text-neutral-300 leading-relaxed">{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="bg-white/80 dark:bg-neutral-900/80 rounded-2xl border border-primary-200 dark:border-neutral-700 p-6 shadow-lg">
            <p className="text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold">Penting:</span> Dengan mengikuti pemilihan ini, Anda dianggap telah membaca, memahami, dan menyetujui seluruh peraturan yang berlaku.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
