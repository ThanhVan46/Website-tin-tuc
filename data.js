/**
 * data.js — Dữ liệu nền + tiện ích LocalStorage cho ứng dụng tin tức
 * LocalStorage key: "dantri_data"  →  { version, menu: [...], posts: [...] }
 * Dùng chung cho mọi trang: <script src="data.js"></script>
 *
 * PHIÊN BẢN 2 – đã sửa:
 *  - Mỗi bài có id DUY NHẤT (mau-<chuyên-mục>-<số>)  → bấm bài nào ra đúng bài đó
 *  - Sinh bài cho CẢ chuyên mục con                   → chuyên mục con có bài
 *  - Nội dung mỗi bài dài 8 đoạn, riêng theo chuyên mục
 *  - Bài thuộc mục con có category = [Mục lớn, Mục con] (breadcrumb + ảnh theo mục lớn)
 *  - Bỏ link bài gốc (không còn trường url ở bài mẫu)
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "dantri_data";
  const DATA_VERSION = 3;            // tăng số này khi đổi cấu trúc/dữ liệu mẫu → tự nạp lại
  const SOURCE = "dantri.com.vn";

  /* ---------- 1. MENU PHÂN CẤP ---------- */
  const MENU = [
    { id: "thoi-su", title: "Thời sự", url: "/xa-hoi.htm", type: "category", children: [
      { id: "chinh-tri", title: "Chính trị", url: "/chinh-tri.htm", type: "sub-category" },
      { id: "giao-thong", title: "Giao thông", url: "/giao-thong.htm", type: "sub-category" },
      { id: "moi-truong", title: "Môi trường", url: "/moi-truong.htm", type: "sub-category" }
    ]},
    { id: "phap-luat", title: "Pháp luật", url: "/phap-luat.htm", type: "category" },
    { id: "the-gioi", title: "Thế giới", url: "/the-gioi.htm", type: "category", children: [
      { id: "kieu-bao", title: "Kiều bào", url: "/kieu-bao.htm", type: "sub-category" },
      { id: "quan-su", title: "Quân sự", url: "/quan-su.htm", type: "sub-category" }
    ]},
    { id: "kinh-doanh", title: "Kinh doanh", url: "/kinh-doanh.htm", type: "category", children: [
      { id: "doanh-nghiep", title: "Doanh nghiệp", url: "/doanh-nghiep.htm", type: "sub-category" },
      { id: "tai-chinh", title: "Tài chính", url: "/tai-chinh.htm", type: "sub-category" }
    ]},
    { id: "giao-duc", title: "Giáo dục", url: "/giao-duc.htm", type: "category", children: [
      { id: "tuyen-sinh", title: "Tuyển sinh", url: "/tuyen-sinh.htm", type: "sub-category" }
    ]},
    { id: "the-thao", title: "Thể thao", url: "/the-thao.htm", type: "category" },
    { id: "cong-nghe", title: "Công nghệ", url: "/cong-nghe.htm", type: "category" },
    { id: "suc-khoe", title: "Sức khỏe", url: "/suc-khoe.htm", type: "category" }
  ];

  /* ---------- 2. TIỆN ÍCH ---------- */
  function slugify(text) {
    return String(text || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  const pad = (n, len = 2) => String(n).padStart(len, "0");

  /* ---------- 3. NỘI DUNG MẪU THEO TỪNG CHUYÊN MỤC ----------
   * heads: tiêu đề bài (mỗi mục 1 bài/tiêu đề) · paras: 5 đoạn nội dung riêng của mục.
   * Khi có bài thật, thêm bằng crawler.html – bài thật sẽ nằm cùng các bài mẫu này. */
  const CONTENT = {
    "thoi-su": {
      heads: [
        "Hà Nội đẩy nhanh tiến độ các dự án hạ tầng trọng điểm cuối năm",
        "Nhiều địa phương rà soát phương án ứng phó với mưa lũ muộn",
        "Cải cách thủ tục hành chính: người dân được lợi gì?",
        "Đô thị thông minh và bài toán quản lý dân cư",
        "Cử tri kiến nghị nhiều vấn đề dân sinh bức xúc",
        "Chuyển đổi số tại cấp xã: kết quả bước đầu"
      ],
      paras: [
        "Theo ghi nhận của phóng viên, các cơ quan chức năng đã triển khai nhiều biện pháp đồng bộ nhằm bảo đảm tiến độ và chất lượng công việc, đồng thời tăng cường kiểm tra, giám sát ngay tại hiện trường.",
        "Đại diện đơn vị phụ trách cho biết, việc điều hành được thực hiện theo từng giai đoạn với mục tiêu rõ ràng, phân công cụ thể đến từng bộ phận và có báo cáo định kỳ để kịp thời điều chỉnh khi phát sinh vướng mắc.",
        "Người dân sinh sống trong khu vực ghi nhận những thay đổi tích cực trong đời sống hằng ngày, song cũng mong muốn chính quyền tiếp tục lắng nghe và giải đáp thỏa đáng các kiến nghị còn tồn đọng.",
        "Các chuyên gia về quản lý nhà nước nhận định, thành công của chính sách không chỉ nằm ở việc ban hành văn bản mà còn ở khâu tổ chức thực hiện, sự phối hợp giữa các ngành và tinh thần trách nhiệm của người đứng đầu.",
        "Trong thời gian tới, các địa phương sẽ tiếp tục tổng kết, rút kinh nghiệm từ thực tiễn để hoàn thiện cơ chế, hướng tới mục tiêu phục vụ người dân ngày một tốt hơn."
      ]
    },
    "chinh-tri": {
      heads: [
        "Kỳ họp Quốc hội thảo luận nhiều nội dung quan trọng về phát triển kinh tế - xã hội",
        "Đại biểu nhấn mạnh yêu cầu nâng cao hiệu quả giám sát tối cao",
        "Công tác cán bộ: đổi mới cách đánh giá theo kết quả công việc",
        "Tăng cường đối thoại giữa chính quyền và nhân dân ở cơ sở",
        "Hoàn thiện thể chế để tháo gỡ điểm nghẽn phát triển",
        "Đẩy mạnh học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh"
      ],
      paras: [
        "Phát biểu thảo luận, nhiều đại biểu cho rằng cần tiếp tục đổi mới phương thức làm việc, bảo đảm các quyết sách được ban hành kịp thời, sát thực tiễn và có tính khả thi cao.",
        "Theo các đại biểu, việc nâng cao chất lượng xây dựng pháp luật cần đi đôi với tăng cường kiểm tra, giám sát nhằm kịp thời phát hiện bất cập khi đưa chính sách vào cuộc sống.",
        "Một số ý kiến đề nghị làm rõ trách nhiệm của từng cơ quan, từng cá nhân trong tổ chức thực hiện, tránh tình trạng đùn đẩy hoặc chậm trễ làm ảnh hưởng đến quyền lợi của người dân và doanh nghiệp.",
        "Cử tri và dư luận đánh giá cao tinh thần thẳng thắn, cầu thị trong các phiên thảo luận, đồng thời kỳ vọng những vấn đề được nêu sẽ sớm được giải quyết bằng các giải pháp cụ thể.",
        "Kết thúc nội dung làm việc, các cơ quan hữu quan tiếp thu ý kiến, hoàn chỉnh báo cáo và đề ra lộ trình thực hiện trong thời gian tới."
      ]
    },
    "giao-thong": {
      heads: [
        "Giải pháp nào giảm ùn tắc tại các cửa ngõ Thủ đô giờ cao điểm?",
        "Siết chặt xử lý vi phạm nồng độ cồn trên các tuyến quốc lộ",
        "Đường sắt đô thị: người dân háo hức, chờ trải nghiệm thực tế",
        "Cao tốc Bắc - Nam: những đoạn cuối cùng về đích",
        "Phân luồng giao thông dịp cuối tuần, người dân cần lưu ý gì?",
        "Làn đường dành riêng cho xe buýt: hiệu quả ra sao sau thời gian thí điểm"
      ],
      paras: [
        "Tại nhiều nút giao trọng điểm, lực lượng chức năng được bố trí túc trực để điều tiết, kịp thời giải tỏa ùn ứ khi lưu lượng phương tiện tăng đột biến vào khung giờ cao điểm.",
        "Theo cơ quan quản lý, nguyên nhân gây ùn tắc đến từ nhiều yếu tố: mật độ phương tiện cá nhân lớn, hạ tầng chưa đồng bộ và ý thức chấp hành luật giao thông của một bộ phận người tham gia còn hạn chế.",
        "Các chuyên gia giao thông khuyến nghị cần ưu tiên phát triển vận tải công cộng, kết hợp ứng dụng công nghệ giám sát để điều chỉnh tín hiệu đèn linh hoạt theo thời gian thực.",
        "Người điều khiển phương tiện được khuyến cáo chủ động tìm hiểu lộ trình, tránh các tuyến đang thi công, đồng thời tuân thủ tốc độ và biển báo để bảo đảm an toàn cho bản thân và cộng đồng.",
        "Thời gian tới, ngành giao thông sẽ tiếp tục rà soát điểm đen, đầu tư nâng cấp hạ tầng và tăng cường tuyên truyền để từng bước giảm tai nạn, giảm ùn tắc."
      ]
    },
    "moi-truong": {
      heads: [
        "Chất lượng không khí xấu đi, người dân cần làm gì để bảo vệ sức khỏe?",
        "Phân loại rác tại nguồn: nhiều khu dân cư đã làm được",
        "Sông, hồ nội đô được cải tạo, nước trong trở lại",
        "Trồng thêm cây xanh đô thị: nhiều sáng kiến từ cộng đồng",
        "Nhựa dùng một lần: lộ trình giảm thiểu và những thách thức",
        "Ứng phó biến đổi khí hậu ở vùng ven biển"
      ],
      paras: [
        "Số liệu quan trắc cho thấy chất lượng môi trường có sự biến động theo mùa, đòi hỏi công tác dự báo và cảnh báo phải được thực hiện thường xuyên, kịp thời hơn.",
        "Đại diện cơ quan quản lý môi trường cho biết đang phối hợp với các địa phương rà soát nguồn phát thải, xử lý nghiêm các cơ sở vi phạm quy định về xả thải và bảo vệ môi trường.",
        "Nhiều hộ gia đình đã thay đổi thói quen sinh hoạt như hạn chế túi ni lông, phân loại rác, tiết kiệm điện nước, góp phần giảm áp lực lên hệ thống xử lý chung.",
        "Theo các nhà khoa học, bảo vệ môi trường là nhiệm vụ lâu dài, cần sự tham gia đồng thời của chính quyền, doanh nghiệp và mỗi người dân, trong đó giáo dục ý thức đóng vai trò nền tảng.",
        "Trong thời gian tới, nhiều chương trình truyền thông và mô hình cộng đồng xanh sẽ tiếp tục được nhân rộng để lan tỏa lối sống thân thiện với môi trường."
      ]
    },
    "phap-luat": {
      heads: [
        "Triệt phá đường dây lừa đảo qua mạng, thu giữ nhiều tang vật",
        "Xét xử vụ án kinh tế: dư luận chờ phán quyết công minh",
        "Những quy định mới về xử phạt vi phạm hành chính có hiệu lực từ tháng sau",
        "Cảnh báo thủ đoạn mạo danh cơ quan chức năng để chiếm đoạt tài sản",
        "Tranh chấp đất đai: quyền lợi của người dân được bảo vệ thế nào?",
        "Trẻ em và pháp luật: tăng cường bảo vệ trên không gian mạng",
        "Hòa giải cơ sở: giải pháp giảm tải cho tòa án",
        "Người lao động cần biết gì khi bị chậm lương, nợ bảo hiểm?",
        "Tăng cường phòng chống buôn lậu, gian lận thương mại cuối năm",
        "Giải đáp thắc mắc của bạn đọc về thủ tục thừa kế tài sản"
      ],
      paras: [
        "Theo thông tin từ cơ quan chức năng, vụ việc được phát hiện sau thời gian trinh sát, thu thập chứng cứ. Các đối tượng liên quan đã bị triệu tập để làm rõ hành vi vi phạm.",
        "Đại diện cơ quan điều tra cho biết, quá trình xử lý được thực hiện đúng quy định, bảo đảm khách quan, nghiêm minh và tôn trọng quyền, lợi ích hợp pháp của các bên liên quan.",
        "Luật sư tham gia tư vấn nhận định, người dân cần tìm hiểu kỹ quy định pháp luật, lưu giữ chứng cứ và liên hệ cơ quan có thẩm quyền ngay khi phát hiện dấu hiệu vi phạm.",
        "Cơ quan công an khuyến cáo người dân nâng cao cảnh giác, không cung cấp thông tin cá nhân, mã xác thực hay chuyển tiền cho người lạ qua điện thoại và mạng xã hội.",
        "Công tác tuyên truyền, phổ biến giáo dục pháp luật sẽ tiếp tục được đẩy mạnh nhằm nâng cao ý thức tuân thủ và phòng ngừa vi phạm từ sớm, từ xa."
      ]
    },
    "the-gioi": {
      heads: [
        "Hội nghị thượng đỉnh khu vực tìm kiếm tiếng nói chung về hợp tác kinh tế",
        "Nhiều nền kinh tế lớn điều chỉnh chính sách tiền tệ trước biến động toàn cầu",
        "Thế giới nỗ lực ứng phó với thiên tai ngày càng khắc nghiệt",
        "Cuộc đua phát triển trí tuệ nhân tạo định hình trật tự công nghệ mới",
        "Du lịch quốc tế phục hồi mạnh mẽ, nhiều điểm đến đón lượng khách kỷ lục",
        "Châu Âu bàn giải pháp bảo đảm an ninh năng lượng mùa đông"
      ],
      paras: [
        "Theo các hãng thông tấn quốc tế, nhiều quốc gia đang điều chỉnh chiến lược đối ngoại và kinh tế để thích ứng với bối cảnh toàn cầu có nhiều biến động nhanh và khó lường.",
        "Các nhà phân tích cho rằng đối thoại và hợp tác vẫn là con đường hiệu quả nhất để giải quyết những thách thức chung như an ninh lương thực, năng lượng và biến đổi khí hậu.",
        "Người đứng đầu các tổ chức quốc tế kêu gọi các bên kiềm chế, tăng cường đối thoại và tuân thủ luật pháp quốc tế nhằm duy trì hòa bình, ổn định.",
        "Trong khi đó, thị trường tài chính và chuỗi cung ứng toàn cầu tiếp tục chịu tác động từ các diễn biến chính trị, kinh tế, buộc doanh nghiệp phải chủ động đa dạng hóa nguồn cung.",
        "Giới quan sát dự báo những tuần tới sẽ có thêm nhiều diễn biến đáng chú ý và cần tiếp tục được theo dõi sát sao."
      ]
    },
    "kieu-bao": {
      heads: [
        "Cộng đồng người Việt tại nước ngoài hướng về quê hương dịp cuối năm",
        "Doanh nhân kiều bào đầu tư về nước: cơ hội và kỳ vọng",
        "Dạy tiếng Việt cho thế hệ trẻ xa xứ: những tấm lòng bền bỉ",
        "Bữa cơm Việt nơi xứ người: giữ lửa văn hóa qua ẩm thực",
        "Chính sách thu hút trí thức kiều bào đóng góp cho đất nước",
        "Hành trình trở về của những người con xa quê"
      ],
      paras: [
        "Dù sinh sống xa Tổ quốc, bà con kiều bào luôn dành tình cảm đặc biệt cho quê hương và thường xuyên tổ chức các hoạt động văn hóa, cộng đồng để gìn giữ bản sắc dân tộc.",
        "Nhiều hội đoàn người Việt ở nước ngoài duy trì các lớp học tiếng Việt, câu lạc bộ văn nghệ, giúp thế hệ con em sinh ra ở nước ngoài hiểu hơn về cội nguồn.",
        "Đại diện các cơ quan chức năng khẳng định Nhà nước luôn coi cộng đồng người Việt Nam ở nước ngoài là bộ phận không tách rời và là nguồn lực quan trọng của đất nước.",
        "Nhiều trí thức, doanh nhân kiều bào đã tham gia tư vấn, chuyển giao công nghệ, đầu tư kinh doanh, góp phần thúc đẩy quan hệ hợp tác giữa Việt Nam và các nước.",
        "Những câu chuyện về tinh thần tương thân tương ái, hướng về quê hương của bà con tiếp tục là nguồn cảm hứng cho nhiều thế hệ."
      ]
    },
    "quan-su": {
      heads: [
        "Xu hướng hiện đại hóa quân đội của nhiều quốc gia trong khu vực",
        "Diễn tập chung đa quốc gia nhằm tăng cường hợp tác an ninh",
        "Công nghệ không người lái thay đổi cách thức tác chiến hiện đại",
        "Hải quân các nước đẩy mạnh hợp tác bảo đảm an toàn hàng hải",
        "Lịch sử các cuộc cải cách quốc phòng và bài học cho hiện tại",
        "Lực lượng gìn giữ hòa bình: vai trò ngày càng quan trọng"
      ],
      paras: [
        "Theo giới chuyên gia quân sự, xu hướng chung hiện nay là ứng dụng công nghệ cao, tự động hóa và trí tuệ nhân tạo vào công tác huấn luyện, chỉ huy và bảo đảm hậu cần.",
        "Các cuộc diễn tập chung được đánh giá là kênh quan trọng để các bên tăng cường hiểu biết, xây dựng lòng tin và nâng cao khả năng phối hợp trong ứng phó các thách thức an ninh phi truyền thống.",
        "Giới phân tích nhấn mạnh việc hiện đại hóa quốc phòng cần gắn liền với mục tiêu phòng thủ, bảo vệ hòa bình và tuân thủ các chuẩn mực của luật pháp quốc tế.",
        "Bên cạnh đó, hợp tác trong các lĩnh vực như cứu hộ, cứu nạn, phòng chống thiên tai cũng là điểm sáng trong quan hệ quốc phòng giữa nhiều quốc gia.",
        "Các chuyên gia cho rằng cần tiếp tục theo dõi những điều chỉnh chiến lược quốc phòng để có cái nhìn đầy đủ và khách quan."
      ]
    },
    "kinh-doanh": {
      heads: [
        "Doanh nghiệp bước vào quý cuối năm với kỳ vọng tăng tốc về đích",
        "Xuất khẩu nông sản: tìm hướng đi bền vững trước yêu cầu khắt khe của thị trường",
        "Người tiêu dùng thắt chặt chi tiêu: nhà bán lẻ thích ứng ra sao?",
        "Thương mại điện tử bứt phá nhờ mua sắm cuối năm",
        "Hàng Việt chinh phục người tiêu dùng trong nước",
        "Chuỗi cung ứng nội địa: từ lo ngại đến cơ hội",
        "Du lịch nội địa sôi động, doanh thu dịch vụ tăng đáng kể",
        "Khởi nghiệp sáng tạo: những mô hình kinh doanh mới nổi",
        "Thị trường bất động sản: tín hiệu thận trọng từ người mua thực",
        "Chuyển đổi xanh trở thành tiêu chí cạnh tranh của doanh nghiệp"
      ],
      paras: [
        "Theo đánh giá của các tổ chức nghiên cứu thị trường, hoạt động sản xuất kinh doanh đang có những dấu hiệu khởi sắc nhưng vẫn còn nhiều yếu tố bất định cần theo dõi.",
        "Đại diện nhiều doanh nghiệp cho biết, để duy trì đà tăng trưởng, đơn vị đã chủ động tái cơ cấu chi phí, đa dạng hóa thị trường và đầu tư vào công nghệ để nâng cao năng suất.",
        "Các chuyên gia kinh tế khuyến nghị doanh nghiệp cần xây dựng kế hoạch tài chính thận trọng, bảo đảm dòng tiền và tăng cường khả năng chống chịu trước biến động bên ngoài.",
        "Về phía cơ quan quản lý, nhiều giải pháp hỗ trợ đang được triển khai nhằm tháo gỡ khó khăn, cải thiện môi trường kinh doanh và thúc đẩy đầu tư tư nhân.",
        "Người tiêu dùng được khuyến cáo cân nhắc kỹ trước khi mua sắm, ưu tiên các nhà cung cấp uy tín và tìm hiểu rõ chính sách bảo hành, đổi trả."
      ]
    },
    "doanh-nghiep": {
      heads: [
        "Doanh nghiệp nhỏ và vừa tìm lối đi giữa áp lực chi phí",
        "Nhiều doanh nghiệp đẩy mạnh chuyển đổi số để giảm chi phí vận hành",
        "Nhân sự chất lượng cao: bài toán chưa có lời giải dễ dàng",
        "Doanh nghiệp gia đình và câu chuyện chuyển giao thế hệ",
        "Quản trị rủi ro: bài học từ những doanh nghiệp vượt khó",
        "Thương hiệu Việt vươn ra thị trường quốc tế"
      ],
      paras: [
        "Theo khảo sát, phần lớn doanh nghiệp nhỏ và vừa cho biết áp lực lớn nhất hiện nay đến từ chi phí đầu vào, lãi vay và sức mua thị trường còn yếu.",
        "Để thích ứng, nhiều đơn vị lựa chọn tinh gọn bộ máy, tối ưu quy trình, tập trung vào sản phẩm chủ lực và nâng cao chất lượng dịch vụ khách hàng.",
        "Lãnh đạo doanh nghiệp cho rằng chuyển đổi số không còn là lựa chọn mà là yêu cầu bắt buộc để duy trì khả năng cạnh tranh trong dài hạn.",
        "Các hiệp hội doanh nghiệp đề nghị tiếp tục cải cách thủ tục hành chính, tạo thuận lợi về tiếp cận vốn, mặt bằng và nguồn nhân lực.",
        "Giới chuyên gia nhận định, doanh nghiệp xây dựng được văn hóa minh bạch, trách nhiệm sẽ có nền tảng vững chắc để phát triển bền vững."
      ]
    },
    "tai-chinh": {
      heads: [
        "Lãi suất tiết kiệm biến động, người gửi tiền nên cân nhắc điều gì?",
        "Thị trường chứng khoán: nhà đầu tư cá nhân thận trọng trước các nhịp rung lắc",
        "Giá vàng trong nước và thế giới: những yếu tố chi phối",
        "Thanh toán không tiền mặt len lỏi vào đời sống thường ngày",
        "Quản lý chi tiêu cá nhân: kỹ năng cần có trong thời kỳ nhiều biến động",
        "Ngân hàng đẩy mạnh bảo mật, cảnh báo thủ đoạn lừa đảo tài chính"
      ],
      paras: [
        "Theo các chuyên gia tài chính, diễn biến thị trường thời gian qua chịu ảnh hưởng của cả yếu tố trong nước lẫn quốc tế, trong đó có chính sách tiền tệ và kỳ vọng của nhà đầu tư.",
        "Người dân tham gia đầu tư cần xác định rõ mục tiêu, khẩu vị rủi ro, không vay mượn quá khả năng chi trả và hạn chế chạy theo tâm lý đám đông.",
        "Các tổ chức tín dụng cho biết đang tiếp tục tối ưu sản phẩm, cải thiện trải nghiệm khách hàng và tăng cường biện pháp bảo mật trong giao dịch trực tuyến.",
        "Chuyên gia khuyến cáo nên phân bổ tài sản hợp lý, xây dựng quỹ dự phòng khẩn cấp và tìm hiểu kỹ thông tin từ nguồn chính thống trước khi ra quyết định.",
        "Đây chỉ là thông tin tham khảo, không phải khuyến nghị đầu tư. Bạn đọc nên tham vấn chuyên gia khi cần thiết."
      ]
    },
    "giao-duc": {
      heads: [
        "Đổi mới dạy và học: giáo viên và học sinh thích ứng ra sao?",
        "Nhiều trường phổ thông đẩy mạnh giáo dục kỹ năng sống cho học sinh",
        "Giảm áp lực học tập: lời giải cho bài toán nhiều năm",
        "Sinh viên ra trường: kỹ năng nào doanh nghiệp cần nhất?",
        "Ứng dụng công nghệ trong lớp học: cơ hội và lưu ý",
        "Học bổng, hỗ trợ học tập: cánh cửa mở ra cho học trò vùng khó"
      ],
      paras: [
        "Theo các nhà giáo, việc đổi mới phương pháp dạy học cần lấy người học làm trung tâm, khuyến khích tư duy phản biện, sáng tạo và khả năng tự học suốt đời.",
        "Nhiều trường học chủ động tăng cường hoạt động trải nghiệm, ngoại khóa, giúp học sinh phát triển toàn diện về thể chất, tinh thần và kỹ năng xã hội.",
        "Phụ huynh bày tỏ mong muốn nhà trường và gia đình phối hợp chặt chẽ hơn, giảm áp lực thành tích và quan tâm đến sức khỏe tinh thần của trẻ.",
        "Các chuyên gia giáo dục nhấn mạnh vai trò của đội ngũ giáo viên, cần được đào tạo, bồi dưỡng thường xuyên để đáp ứng yêu cầu đổi mới.",
        "Ngành giáo dục sẽ tiếp tục lắng nghe phản hồi từ thực tiễn để điều chỉnh chính sách phù hợp, hướng tới chất lượng và công bằng."
      ]
    },
    "tuyen-sinh": {
      heads: [
        "Thí sinh cần chuẩn bị gì cho mùa tuyển sinh sắp tới?",
        "Cách chọn ngành, chọn trường phù hợp năng lực và sở thích",
        "Xu hướng xét tuyển kết hợp nhiều phương thức: những điều cần biết",
        "Tuyển sinh đại học: lưu ý khi đăng ký nguyện vọng",
        "Học sinh lớp 12 ôn thi hiệu quả trong giai đoạn nước rút",
        "Tư vấn hướng nghiệp sớm giúp học sinh tự tin chọn ngành"
      ],
      paras: [
        "Theo các chuyên gia tư vấn tuyển sinh, thí sinh nên tìm hiểu kỹ thông tin ngành học, chuẩn đầu ra, cơ hội việc làm và điều kiện xét tuyển của từng trường.",
        "Việc chọn ngành không nên chỉ dựa vào điểm số hay xu hướng nhất thời, mà cần cân nhắc năng lực, sở thích và định hướng nghề nghiệp lâu dài của bản thân.",
        "Phụ huynh nên đóng vai trò đồng hành, lắng nghe và hỗ trợ thông tin, tránh áp đặt lựa chọn khiến con em chịu áp lực không cần thiết.",
        "Các trường đại học cho biết sẽ công bố đầy đủ thông tin tuyển sinh trên cổng thông tin chính thức, thí sinh cần theo dõi để không bỏ lỡ mốc thời gian quan trọng.",
        "Thí sinh nên chủ động lập kế hoạch ôn tập khoa học, giữ gìn sức khỏe và duy trì tinh thần thoải mái trong suốt quá trình chuẩn bị."
      ]
    },
    "the-thao": {
      heads: [
        "Đội tuyển chuẩn bị kỹ lưỡng cho chuỗi trận quan trọng sắp tới",
        "Bóng đá trẻ: nền tảng cho thành công bền vững",
        "Vận động viên vượt khó, giành thành tích đáng tự hào",
        "Phong trào chạy bộ lan rộng, người dân tìm đến thể thao để rèn luyện sức khỏe",
        "Giải đấu trong nước thu hút đông đảo khán giả",
        "Bí quyết giữ phong độ của các vận động viên đỉnh cao",
        "Thể thao học đường: hạt giống cho tương lai",
        "Cầu lông, bóng bàn tiếp tục là thế mạnh ở đấu trường khu vực",
        "Công nghệ phân tích dữ liệu thay đổi cách huấn luyện",
        "Những khoảnh khắc đáng nhớ của thể thao trong tuần qua"
      ],
      paras: [
        "Theo ban huấn luyện, các cầu thủ, vận động viên đã trải qua giai đoạn tập luyện tích cực, tập trung nâng cao thể lực, chiến thuật và tinh thần thi đấu.",
        "Huấn luyện viên cho biết đội hình đang ở trạng thái tâm lý tốt, đồng thời nhấn mạnh việc tôn trọng đối thủ và tập trung vào từng trận đấu cụ thể.",
        "Người hâm mộ thể hiện sự quan tâm đặc biệt, kỳ vọng các đại diện sẽ thi đấu hết mình và mang về kết quả tích cực.",
        "Các chuyên gia thể thao nhận định, để phát triển bền vững cần chú trọng đào tạo trẻ, đầu tư cơ sở vật chất và xây dựng hệ thống giải đấu chuyên nghiệp.",
        "Bên cạnh thành tích, tinh thần fair-play, kỷ luật và sự đoàn kết vẫn là giá trị cốt lõi của thể thao Việt Nam."
      ]
    },
    "cong-nghe": {
      heads: [
        "Trí tuệ nhân tạo đi vào đời sống: lợi ích và những lưu ý",
        "Bảo mật tài khoản cá nhân: các bước đơn giản nhưng hiệu quả",
        "Điện thoại thông minh thế hệ mới tập trung vào trải nghiệm AI",
        "Chuyển đổi số trong doanh nghiệp: từ khẩu hiệu đến hành động",
        "Học lập trình từ sớm: xu hướng mới của học sinh",
        "Xe điện và hạ tầng sạc: bài toán của đô thị tương lai",
        "Nhận diện tin giả, thông tin sai lệch trên mạng xã hội",
        "Điện toán đám mây giúp doanh nghiệp nhỏ tiết kiệm chi phí",
        "Công nghệ y tế số giúp người dân tiếp cận dịch vụ thuận tiện hơn",
        "An toàn khi mua sắm trực tuyến: cần kiểm tra những gì?"
      ],
      paras: [
        "Theo các chuyên gia công nghệ, sự phát triển nhanh chóng của trí tuệ nhân tạo và dữ liệu lớn đang mở ra nhiều cơ hội nhưng cũng đặt ra yêu cầu mới về bảo mật và đạo đức sử dụng.",
        "Người dùng cần chủ động cập nhật phần mềm, sử dụng mật khẩu mạnh, bật xác thực hai lớp và thận trọng với các đường dẫn, tin nhắn lạ.",
        "Doanh nghiệp công nghệ trong nước đang đẩy mạnh nghiên cứu, phát triển sản phẩm, hướng tới làm chủ các công nghệ lõi và đáp ứng nhu cầu của thị trường.",
        "Các chuyên gia cho rằng, bên cạnh đầu tư thiết bị, yếu tố con người và quy trình mới là chìa khóa để công nghệ phát huy hiệu quả thực sự.",
        "Bạn đọc nên tìm hiểu kỹ thông tin từ các nguồn đáng tin cậy trước khi sử dụng sản phẩm, dịch vụ công nghệ mới."
      ]
    },
    "suc-khoe": {
      heads: [
        "Chuyển mùa, cẩn trọng với các bệnh hô hấp ở trẻ nhỏ và người cao tuổi",
        "Giấc ngủ và sức khỏe: vì sao cần ngủ đủ và đúng giờ?",
        "Chế độ ăn cân bằng: nền tảng của cơ thể khỏe mạnh",
        "Khám sức khỏe định kỳ: đừng chỉ đi khi có triệu chứng",
        "Sức khỏe tinh thần: đừng ngại tìm kiếm sự giúp đỡ",
        "Vận động mỗi ngày: bắt đầu từ những việc nhỏ nhất",
        "Phòng chống sốt xuất huyết: những khuyến cáo từ ngành y tế",
        "Người làm văn phòng và nguy cơ đau cổ vai gáy",
        "Tiêm chủng đầy đủ: lá chắn bảo vệ cộng đồng",
        "An toàn thực phẩm: lưu ý khi chọn mua và chế biến"
      ],
      paras: [
        "Theo bác sĩ, thay đổi thời tiết là điều kiện thuận lợi để các tác nhân gây bệnh phát triển, người dân cần chủ động giữ ấm, vệ sinh cá nhân và tăng cường sức đề kháng.",
        "Các chuyên gia dinh dưỡng khuyến nghị xây dựng chế độ ăn đa dạng, nhiều rau xanh, trái cây, hạn chế thực phẩm chế biến sẵn, nhiều đường và muối.",
        "Duy trì thói quen vận động đều đặn, ngủ đủ giấc và giảm căng thẳng giúp cải thiện sức khỏe thể chất lẫn tinh thần một cách bền vững.",
        "Người dân khi có dấu hiệu bất thường kéo dài nên đến cơ sở y tế uy tín để được thăm khám, không tự ý dùng thuốc.",
        "Thông tin trong bài chỉ mang tính tham khảo chung, không thay thế chẩn đoán và tư vấn của bác sĩ."
      ]
    }
  };

  const AUTHORS = ["Minh Anh", "Thu Hà", "Quốc Việt", "Hải Long", "Lan Phương"];
  const OPENERS = [
    h => `Câu chuyện xoay quanh “${h}” đang thu hút sự quan tâm của đông đảo bạn đọc trong những ngày qua.`,
    h => `Thông tin về “${h}” được nhiều người theo dõi, đặt ra không ít vấn đề cần được nhìn nhận đầy đủ.`,
    h => `Trong những ngày gần đây, “${h}” trở thành chủ đề được dư luận bàn luận sôi nổi.`,
    h => `Phóng viên đã ghi nhận nhiều ý kiến xung quanh nội dung “${h}” từ cơ quan chức năng, chuyên gia và người dân.`
  ];
  const CLOSERS = [
    "Nhiều ý kiến cho rằng, bên cạnh những kết quả đã đạt được, vẫn cần thêm thời gian và sự phối hợp đồng bộ để giải quyết tận gốc các vấn đề còn tồn tại.",
    "Chúng tôi sẽ tiếp tục cập nhật thông tin về vấn đề này khi có diễn biến mới. Mời bạn đọc theo dõi và chia sẻ ý kiến của mình."
  ];

  function buildPost(node, parent, c, head, i, k) {
    const d = new Date(2026, 9, 19, 18, 0);
    d.setMinutes(d.getMinutes() - (i * 420 + k * 23));   // bài thứ i của MỌI mục xen kẽ nhau → trang chủ đa dạng chuyên mục
    const rot = c.paras.slice(i % c.paras.length).concat(c.paras.slice(0, i % c.paras.length));
    return {
      id: `mau-${node.id}-${i + 1}`,                       // DUY NHẤT cho mỗi bài
      title: head,
      slug: slugify(head),
      excerpt: rot[0],                                                  // sapo: đoạn riêng của mục, không lặp tiêu đề
      content: [OPENERS[i % OPENERS.length](head), ...rot.slice(1), ...CLOSERS].join("\n"),
      author: AUTHORS[(i + k) % AUTHORS.length],
      category: parent ? [parent.title, node.title] : [node.title],
      publishedAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      source: SOURCE
    };
  }

  function buildSamplePosts() {
    const posts = []; let k = 0;
    const walk = (node, parent) => {
      const c = CONTENT[node.id];
      if (c) c.heads.forEach((h, i) => posts.push(buildPost(node, parent, c, h, i, k++)));
      (node.children || []).forEach(ch => walk(ch, node));
    };
    MENU.forEach(m => walk(m, null));
    return posts;
  }

  /* ---------- 4. API LOCALSTORAGE ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch (e) { return null; }
  }
  function save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  /** Khởi tạo / nâng cấp dữ liệu. Bài do crawler thêm vào được GIỮ LẠI khi nâng cấp. */
  function init() {
    const data = load();
    if (data && data.version === DATA_VERSION && Array.isArray(data.menu) && Array.isArray(data.posts)) return data;

    const old = data && Array.isArray(data.posts) ? data.posts : [];
    const crawled = old.filter(p => p && p.content && !String(p.id).startsWith("mau-") && !String(p.content).includes("Đây là đoạn mở đầu của bài viết"));
    const fresh = { version: DATA_VERSION, menu: MENU, posts: [...crawled, ...buildSamplePosts()] };
    save(fresh);
    return fresh;
  }

  function getPosts() { return init().posts; }

  function addPost(post) {
    const data = init();
    if (data.posts.some(p => p.id === post.id)) return { added: false, reason: "duplicate" };
    data.posts.unshift(post);
    save(data);
    return { added: true };
  }

  function getImage(id) {
    const p = init().posts.find(x => x.id === id);
    return (p && p.image) || "";
  }

  function resetData() { localStorage.removeItem(STORAGE_KEY); return init(); }

  init();

  global.DataStore = { STORAGE_KEY, SOURCE, slugify, init, getPosts, addPost, getImage, resetData };
})(window);
