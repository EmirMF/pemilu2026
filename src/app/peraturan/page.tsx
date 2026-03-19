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
      'Bakal Calon General Manager adalah Kru 8EH Radio ITB yang telah mengambil dan mengembalikan berkas pendaftaran secara sadar dan tanpa paksaan.',
      'Minimal telah berkegiatan satu tahun di 8EH Radio ITB.',
      'Tidak terkena sanksi akademik dari ITB.',
      'Tidak menjabat sebagai Panitia Pemilu 8EH Radio ITB 2025.',
      'Didukung oleh minimal sejumlah 30% kru aktif tiap angkatan kru (28-30) yang dibuktikan dalam bentuk lembar dukungan.',
      'Telah mempersiapkan formatur minimal 1 orang dan tim sukses minimal 2 orang.',
      'Kru aktif maupun Kru nonaktif dapat memberikan dukungan kepada Bakal Calon General Manager.',
      'Berdasarkan data Kru aktif tahun 2024 periode genap, maka jumlah Kru yang harus memberikan dukungan adalah minimal 23 orang untuk Kru 30, 21 orang untuk Kru 29, dan 9 orang untuk Kru 28.',
    ],
  },
  {
    id: 2,
    title: 'Ketentuan Calon General Manager',
    content: [
      'Calon General Manager adalah Bakal Calon General Manager yang telah mengembalikan berkas dan lolos tahap verifikasi.',
      'Calon General Manager wajib bersungguh-sungguh dalam mengikuti kegiatan Pemilu 8EH Radio ITB 2025, termasuk membantu panitia mengajak massa 8EH Radio ITB untuk berpartisipasi dalam rangkaian acara pemilu, serta menaati segala peraturan yang telah ditetapkan Panitia Pemilu 8EH Radio ITB 2025.',
      'Calon General Manager berhak mendapat perlakuan secara adil.',
      'Calon General Manager wajib hadir maksimal 5 menit sebelum rangkaian acara pemilu dimulai.',
    ],
  },
  {
    id: 3,
    title: 'Ketentuan Formatur',
    content: [
      'Formatur adalah Kru 8EH Radio ITB berjumlah minimal satu orang dan maksimal dua orang yang membantu Calon General Manager dalam segala hal yang berkaitan dengan pemilu, mulai dari perumusan visi misi hingga pelaksanaan voting.',
      'Formatur diizinkan untuk berdiskusi dengan Calon GM dalam menjawab pertanyaan saat hearing, debat, maupun uji panelis. Namun, penyampaian jawaban harus tetap dilakukan oleh Calon General Manager (tidak diwakilkan formatur).',
      'Formatur wajib mengikuti seluruh rangkaian pemilu kecuali atas izin yang dapat diterima oleh Panitia Pemilu 8EH Radio ITB 2025. Setidak-tidaknya minimal 1 orang formatur hadir pada suatu rangkaian acara.',
      'Formatur berasal dari Kru 8EH Radio ITB yang sudah aktif menjadi Kru 8EH Radio ITB seminimal-minimalnya selama satu tahun.',
      'Formatur wajib hadir maksimal 5 menit sebelum rangkaian acara pemilu dimulai.',
      'Formatur tidak diperkenankan bertugas sebagai Panitia Pemilu 8EH Radio ITB 2025.',
    ],
  },
  {
    id: 4,
    title: 'Ketentuan Tim Sukses',
    content: [
      'Tim sukses adalah sekelompok orang yang terdiri dari Kru 8EH Radio ITB berjumlah minimal dua orang dan maksimal lima orang untuk membantu Calon General Manager dalam menyebarkan pensuasanaan pada masa kampanye.',
      'Tim sukses hanya memiliki hak membantu pensuasanaan, mulai dari menyebarkan materi kampanye, mengajak massa menghadiri hearing dan uji panelis, hingga meminta massa 8EH Radio ITB mengisi lembar dukungan.',
      'Tim sukses harus terdiri setidaknya satu kru dari setiap angkatan yang memberikan dukungan pada lembar dukungan.',
      'Tim sukses tidak diperkenankan bertugas sebagai Panitia Pemilu 8EH Radio ITB 2025.',
      'Tim sukses bukan merupakan Management Board 8EH Periode 2024/2025.',
    ],
  },
  {
    id: 5,
    title: 'Ketentuan Berkas',
    content: [
      'Berkas adalah dokumen yang wajib diserahkan oleh seorang Kru 8EH Radio ITB untuk menjadi Bakal Calon General Manager 8EH Radio ITB yang terdiri dari:',
      '• Curriculum vitae',
      '• Surat pernyataan Calon General Manager',
      '• Surat pernyataan izin orang tua Calon General Manager',
      '• Motivation letter dengan tema "Tentang Aku dan 8EH"',
      '• Lembar dukungan minimal dari 30% Kru aktif dari anggota tiap angkatan kru (28-30)',
      '• Lembar identitas formatur',
      '• Lembar identitas tim sukses',
      '• Draft pencalonan General Manager 8EH Radio ITB',
      '• Hasil scan Kartu Tanda Penduduk (KTP)',
      '• Hasil scan Kartu Tanda Mahasiswa (KTM)',
      '• Hasil scan sertifikat prestasi (jika ada)',
      'Kru 8EH Radio ITB yang ingin mengambil atau mengembalikan berkas dapat menghubungi Koordinator Pemilu 8EH Radio ITB 2025.',
      'Kru 8EH Radio ITB yang ingin mengambil berkas harus membayar uang deposit sebesar Rp100.000,00 yang akan dikembalikan pada masa voting.',
      'Apabila Calon General Manager melakukan pelanggaran selama Pemilu 8EH Radio ITB 2025, uang deposit yang dikembalikan akan dikurangi sesuai sanksi yang telah ditetapkan.',
      'Kru 8EH Radio ITB yang sudah mengambil berkas, tetapi tidak mengembalikan berkas, maka uang deposit akan dianggap hangus.',
    ],
  },
  {
    id: 6,
    title: 'Ketentuan Kampanye',
    content: [
      'Kampanye adalah serangkaian kegiatan yang dilakukan Calon General Manager dan tim sukses untuk mempromosikan Calon General Manager selama masa kampanye berlangsung.',
      'Masa kampanye berlangsung selama 29 Maret - 9 April 2025.',
      'Kampanye dapat dilakukan melalui media apa pun dan dalam bentuk apa pun (infografis, video, poster, dan lain-lain).',
      'Sebelum melakukan kegiatan kampanye, Calon General Manager atau tim sukses harus mengabari Koordinator Pemilu 8EH Radio ITB 2025 H-1 sebelum kegiatan dilaksanakan.',
      'Segala media kampanye wajib dihapus saat masa tenang, kecuali kampanye berupa pesan di Bukomline 8EH Radio ITB, tidak perlu ditarik, tetapi dilarang membalas pesan tersebut. Apabila ada pesan yang di-announce, maka wajib melakukan unannounce pada masa tenang.',
      'Konten kampanye dilarang mengandung unsur suku, agama, dan ras (SARA) atau menjatuhkan Calon General Manager lain.',
      'Segala pelanggaran yang terjadi dapat dilaporkan kepada Koordinator Pemilu 8EH Radio ITB 2025.',
    ],
  },
  {
    id: 7,
    title: 'Ketentuan Kuota Forum',
    content: [
      'Kuota forum adalah jumlah orang yang harus menghadiri forum hearing dan uji panelis Pemilu 8EH Radio ITB 2025.',
      'Kuota forum untuk tiap angkatan adalah sebagai berikut:',
      '• Kru 30: 90% Kru aktif (69 orang)',
      '• Kru 29: 50% Kru aktif (34 orang)',
      '• Kru 28: 30% Kru aktif (9 orang)',
      'Apabila saat waktu pelaksanaan forum kuota forum masih belum terpenuhi, maka akan diberikan waktu tunggu selama 30 menit. Jika masa tunggu habis dan kuota forum masih belum terpenuhi, maka perwakilan angkatan Kru yang gagal memenuhi kuota forum harus membuat video permintaan maaf bagi angkatan Kru yang memenuhi kuota forum. Video permintaan maaf harus dikirim ke Bukomline 8EH Radio ITB maksimal H+2 keberjalanan forum.',
      'Formatur dan tim sukses tidak dihitung dalam kuota forum.',
      'Gagalnya pemenuhan kuota forum akan mengakibatkan adanya pengurangan poin pada seluruh Calon General Manager.',
    ],
  },
  {
    id: 8,
    title: 'Ketentuan Uji Panelis',
    content: [
      'Uji panelis adalah forum yang diadakan untuk membantu massa 8EH Radio ITB mengenal lebih lanjut para Calon General Manager, khususnya mengenai wawasan tentang 8EH Radio ITB dan kredibilitas Calon General Manager.',
      'Uji panelis dilakukan dengan studi kasus dan debat Calon General Manager. Topik studi kasus terdiri Kepemimpinan, Manajemen & Pengembangan Anggota, Wawasan Keorganisasian 8EH Radio ITB, Product and Service Development 8EH Radio ITB, dan 8EH Radio ITB sebagai Media. Apabila jumlah Calon General Manager lebih dari 1, maka kegiatan Uji panelis akan diganti menjadi kegiatan Debat.',
      'Debat Calon General Manager dilakukan dengan para calon saling melemparkan pertanyaan untuk satu sama lain dengan topik berupa Lingkungan Organisasi 8EH Radio ITB, Potensi Kru 8EH Radio ITB, Profesionalitas dan Kekeluargaan Kru 8EH Radio ITB, 8EH Radio ITB sebagai Media, dan Kaderisasi dan Jenjangnya.',
      'Panelis akan memberikan penilaian kepada Calon General Manager dan hasil nilai tersebut dapat digunakan oleh Calon General Manager untuk mengevaluasi kembali gagasannya untuk 8EH Radio ITB.',
      'Panelis bebas mengajukan pertanyaan kepada Calon General Manager untuk keperluan penilaian setelah studi kasus dan debat dilaksanakan.',
    ],
  },
  {
    id: 9,
    title: 'Ketentuan Hearing',
    content: [
      'Hearing adalah forum yang diadakan sebagai ajang Calon General Manager untuk melakukan perkenalan, memaparkan visi dan misi, serta memaparkan struktur dan elemen lain yang berkaitan dengan gagasan fungsional General Manager di 8EH Radio ITB pada tahun kepengurusan berikutnya.',
      'Dokumen yang akan dipaparkan saat hearing wajib diserahkan kepada Panitia Pemilu 8EH Radio ITB 2025 melalui Koordinator Pemilu 8EH Radio ITB maksimal H-2 pelaksanaan hearing dengan media Google Drive.',
    ],
  },
  {
    id: 10,
    title: 'Ketentuan Hak Suara',
    content: [
      'Setiap Kru aktif maupun Kru tidak aktif memiliki hak suara jika mengikuti minimal 1 dari 2 rangkaian acara pemilu dan memenuhi minimal akumulasi 2 jam waktu kehadiran pada rangkaian acara pemilu, atau mendapat rata-rata nilai kuis lebih dari atau sama dengan 7 pada kedua kuis forum pemilu (hearing dan uji panelis).',
      'Panitia Pemilu 8EH Radio ITB 2025 diperkenankan untuk memilih setelah menyerahkan surat pernyataan komitmen integritas Panitia Pemilu 8EH Radio ITB 2025.',
      'Mekanisme penghitungan akumulasi waktu akan dilaksanakan dengan pengisian form kehadiran dan diverifikasi dengan melihat meeting report yang disediakan online meeting. Apabila terdapat perbedaan jumlah waktu kehadiran, maka meeting report dari online meeting akan dipilih sebagai dasar akumulasi waktu.',
    ],
  },
  {
    id: 11,
    title: 'Ketentuan Sanksi',
    content: [
      'Setiap Calon General Manager memiliki poin awal sejumlah 100 poin.',
      'Calon General Manager yang melakukan pelanggaran akan dikenakan sanksi sesuai yang tertera pada lampiran.',
      'Calon General Manager berhak mendapat pemberitahuan dan konfirmasi dari Panitia Pemilu 8EH Radio ITB mengenai pelanggaran yang dilakukan.',
      'Apabila Calon General Manager memiliki sisa poin sejumlah 70 poin, maka Calon General Manager tersebut wajib membuat video permintaan maaf kepada massa 8EH Radio ITB yang dikirimkan melalui Bukomline 8EH Radio ITB maksimal H+2 setelah dikonfirmasi oleh Panitia Pemilu 8EH Radio ITB 2025.',
      'Apabila poin yang dimiliki seorang Calon General Manager kurang dari 70 poin, maka Calon General Manager tersebut wajib membuat video permintaan maaf dengan menyebutkan seluruh pelanggaran yang telah dibuat kepada massa 8EH Radio ITB yang dikirimkan melalui Bukomline 8EH Radio ITB maksimal H+2 setelah dikonfirmasi oleh Panitia Pemilu 8EH Radio ITB 2025.',
      'Pelanggaran yang dilakukan oleh Calon General Manager akan disosialisasikan kepada massa 8EH Radio ITB melalui Bukomline 8EH Radio ITB pada broadcast berikutnya setelah pelanggaran terjadi.',
      'Setiap pengurangan poin sejumlah 10 poin akan mengurangi uang deposit yang dibayarkan Calon General Manager saat mengambil berkas sejumlah Rp10.000,00.',
      'Apabila poin yang dimiliki seorang Calon General Manager tersisa 0 poin, maka Calon General Manager tersebut akan didiskualifikasi dari Pemilu 8EH Radio ITB 2025.',
      'Nilai minimal poin adalah 0. Apabila seorang Calon General Manager melakukan pelanggaran yang mengakibatkan pengurangan lebih dari 100 poin akumulatif, maka uang deposit yang dikembalikan sejumlah Rp0,00 (nol rupiah).',
      'Pelanggaran khusus yang dilakukan di luar apa yang telah ditentukan di atas akan diputuskan oleh Panitia Pemilu 8EH Radio ITB 2025 dengan sanksi maksimum diskualifikasi.',
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
          <p className="text-xl text-neutral-700 dark:text-neutral-300">Pemilu General Manager 8EH Radio ITB 2025</p>
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
