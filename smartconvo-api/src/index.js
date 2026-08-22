import bcrypt from "bcryptjs";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/guest/register"
    ) {
      return handleGuestRegister(request, env);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/guest/login"
    ) {
      return handleGuestLogin(request, env);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/student/login"
    ) {
      return handleStudentLogin(request, env);
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/admin/login"
    ) {
      return handleAdminLogin(request, env);
    }

    if (
  request.method === "GET" &&
  url.pathname === "/api/admin/profile"
) {
  return handleAdminProfile(request, env);
}

if (
  request.method === "GET" &&
  url.pathname === "/api/admin/dashboard"
) {
  return handleAdminDashboard(request, env);
}
    if (
  request.method === "GET" &&
  url.pathname === "/api/admin/queue"
) {
  return handleAdminQueue(request, env);
}
if (
  request.method === "GET" &&
  url.pathname === "/api/students"
) {
  return handleGetStudents(request, env);
}

if (
  request.method === "PUT" &&
  url.pathname === "/api/admin/queue/status"
) {
  return handleAdminQueueStatusUpdate(request, env);
}

if (
  request.method === "PUT" &&
  url.pathname === "/api/admin/queue/number"
) {
  return handleAdminQueueNumberUpdate(request, env);
}

if (
  request.method === "GET" &&
  url.pathname === "/api/admin/approvals/face"
) {
  return handleFaceApprovalRequests(request, env);
}


    if (
      request.method === "GET" &&
      url.pathname === "/api/guest/profile"
    ) {
      return handleGuestProfile(request, env);
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/student/profile"
    ) {
      return handleStudentProfile(request, env);
    }

    if (
      request.method === "PUT" &&
      url.pathname === "/api/student/profile"
    ) {
      return handleUpdateStudentProfile(request, env);
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/student/simulation"
    ) {
      return handleStudentSimulation(request, env);
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/student/queue"
    ) {
      return handleStudentQueue(request, env);
    }

    if (
      request.method === "GET" &&
      url.pathname === "/"
    ) {
      return jsonResponse({
        success: true,
        message: "SMARTCONVO API is running",
      });
    }

    if (
  request.method === "GET" &&
  url.pathname === "/api/admin/correction-requests"
) {
  return handleGetCorrectionRequests(request, env);
}

if (
  request.method === "PUT" &&
  url.pathname === "/api/admin/correction-requests"
) {
  return handleUpdateCorrectionRequest(request, env);
}

    if (
  request.method === "GET" &&
  url.pathname === "/api/admin/stats"
) {
  try {
    const result = await env.DB
      .prepare("SELECT COUNT(*) AS total FROM students")
      .first();

    return jsonResponse({
      success: true,
      totalRegistered: Number(result?.total || 0),
      quota: 600,
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message,
      },
      500
    );
  }
}

    return jsonResponse(
      {
        success: false,
        message: "Endpoint not found",
      },
      404
    );
  },
};


// ============================================================
// GUEST REGISTER
// ============================================================

async function handleGuestRegister(request, env) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const confirmPassword = body.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      return jsonResponse(
        {
          success: false,
          message: "All fields are required.",
        },
        400
      );
    }

    const gmailRegex = /^[^\s@]+@gmail\.com$/i;

    if (!gmailRegex.test(email)) {
      return jsonResponse(
        {
          success: false,
          message: "Please use a valid Gmail address.",
        },
        400
      );
    }

    if (password.length < 8) {
      return jsonResponse(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        400
      );
    }

    if (password !== confirmPassword) {
      return jsonResponse(
        {
          success: false,
          message: "Passwords do not match.",
        },
        400
      );
    }

    const existingGuest = await env.DB
      .prepare(
        "SELECT id FROM guests WHERE email = ? LIMIT 1"
      )
      .bind(email)
      .first();

    if (existingGuest) {
      return jsonResponse(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        409
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await env.DB
      .prepare(
        `
        INSERT INTO guests (
          name,
          email,
          password,
          role
        )
        VALUES (?, ?, ?, 'guest')
        `
      )
      .bind(
        name,
        email,
        hashedPassword
      )
      .run();

    if (!result.success) {
      return jsonResponse(
        {
          success: false,
          message: "Failed to create guest account.",
        },
        500
      );
    }

    return jsonResponse(
      {
        success: true,
        message: "Guest account created successfully.",
      },
      201
    );

  } catch (error) {
    console.error(
      "Guest registration error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
      },
      500
    );
  }
}


// ============================================================
// GUEST LOGIN
// ============================================================

async function handleGuestLogin(request, env) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return jsonResponse(
        {
          success: false,
          message: "Email and password are required.",
        },
        400
      );
    }

    const gmailRegex = /^[^\s@]+@gmail\.com$/i;

    if (!gmailRegex.test(email)) {
      return jsonResponse(
        {
          success: false,
          message: "Please use a valid Gmail address.",
        },
        400
      );
    }

    const guest = await env.DB
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          password,
          role
        FROM guests
        WHERE email = ?
        LIMIT 1
        `
      )
      .bind(email)
      .first();

    if (!guest) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid email or password.",
        },
        401
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      guest.password
    );

    if (!passwordValid) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid email or password.",
        },
        401
      );
    }

    const token = await createAuthToken(
      {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        role: guest.role,
      },
      env.JWT_SECRET
    );

    return jsonResponse({
      success: true,
      message: "Login successful.",
      token,
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        role: guest.role,
      },
    });

  } catch (error) {
    console.error(
      "Guest login error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
      },
      500
    );
  }
}


// ============================================================
// STUDENT LOGIN
// ============================================================

async function handleStudentLogin(request, env) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const studentId = body.student_id?.trim();
    const password = body.password;

    if (!email || !studentId || !password) {
      return jsonResponse(
        {
          success: false,
          message:
            "Student email, student ID and password are required.",
        },
        400
      );
    }

    const universityEmailRegex =
      /^[^\s@]+@lumut\.tvetmara\.edu\.my$/i;

    if (!universityEmailRegex.test(email)) {
      return jsonResponse(
        {
          success: false,
          message:
            "Please use your university email (@lumut.tvetmara.edu.my).",
        },
        400
      );
    }

    if (!/^\d{7}$/.test(studentId)) {
      return jsonResponse(
        {
          success: false,
          message:
            "Student ID must contain 7 numbers.",
        },
        400
      );
    }

    const student = await env.DB
      .prepare(
        `
        SELECT
          id,
          student_id,
          name,
          email,
          course_code,
          course_name,
          session,
          phone_number,
          faculty,
          cgpa,
          password,
          verification_status,
          face_registration_status,
          face_verification_status,
          convocation_status,
          queue_number,
          created_at
        FROM students
        WHERE student_id = ?
          AND email = ?
        LIMIT 1
        `
      )
      .bind(
        studentId,
        email
      )
      .first();

    if (!student) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid student email or student ID.",
        },
        401
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      student.password
    );

    if (!passwordValid) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid password.",
        },
        401
      );
    }

    const token = await createAuthToken(
      {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        role: "student",
      },
      env.JWT_SECRET
    );

    return jsonResponse({
      success: true,
      message: "Student login successful.",
      token,
      student: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        course_code: student.course_code,
        course_name: student.course_name,
        session: student.session,
        phone_number: student.phone_number,
        faculty: student.faculty,
        cgpa: student.cgpa,
        verification_status:
          student.verification_status,
        face_registration_status:
          student.face_registration_status,
        face_verification_status:
          student.face_verification_status,
        convocation_status:
          student.convocation_status,
        queue_number:
          student.queue_number,
        created_at: student.created_at,
      },
    });

  } catch (error) {
    console.error(
      "Student login error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
      },
      500
    );
  }
}


// ============================================================
// ADMIN LOGIN
// ============================================================

async function handleAdminLogin(request, env) {
  try {
    const body = await request.json();

    const identifier =
      body.identifier?.trim().toLowerCase();

    const password = body.password;

    if (!identifier || !password) {
      return jsonResponse(
        {
          success: false,
          message:
            "Username/email and password are required.",
        },
        400
      );
    }

    const universityEmailRegex =
      /^[^\s@]+@lumut\.tvetmara\.edu\.my$/i;

    if (identifier.includes("@")) {
      if (!universityEmailRegex.test(identifier)) {
        return jsonResponse(
          {
            success: false,
            message:
              "Please use your official @lumut.tvetmara.edu.my email.",
          },
          400
        );
      }
    }

    const admin = await env.DB
      .prepare(
        `
        SELECT
          id,
          username,
          email,
          password,
          role,
          created_at
        FROM admins
        WHERE LOWER(username) = ?
           OR LOWER(email) = ?
        LIMIT 1
        `
      )
      .bind(
        identifier,
        identifier
      )
      .first();

    if (!admin) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid username/email or password.",
        },
        401
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordValid) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid username/email or password.",
        },
        401
      );
    }

    const token = await createAuthToken(
      {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      env.JWT_SECRET
    );

    return jsonResponse({
      success: true,
      message: "Admin login successful.",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error(
      "Admin login error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
      },
      500
    );
  }
}


// ============================================================
// GUEST PROFILE
// ============================================================

async function handleGuestProfile(request, env) {
  try {
    const payload =
      await authenticateRequest(
        request,
        env,
        "guest"
      );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid or expired token.",
        },
        401
      );
    }

    const guest = await env.DB
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          role,
          created_at
        FROM guests
        WHERE id = ?
        LIMIT 1
        `
      )
      .bind(payload.id)
      .first();

    if (!guest) {
      return jsonResponse(
        {
          success: false,
          message:
            "Guest account not found.",
        },
        404
      );
    }

    return jsonResponse({
      success: true,
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        role: guest.role,
        created_at: guest.created_at,
      },
    });

  } catch (error) {
    console.error(
      "Guest profile error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
      },
      500
    );
  }
}


// ============================================================
// STUDENT PROFILE
// ============================================================

async function handleStudentProfile(request, env) {
  try {
    const payload =
      await authenticateRequest(
        request,
        env,
        "student"
      );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid or expired token.",
        },
        401
      );
    }

    const student = await env.DB
      .prepare(
        `
        SELECT
          id,
          student_id,
          name,
          email,
          course_code,
          course_name,
          session,
          phone_number,
          faculty,
          cgpa,
          verification_status,
          face_registration_status,
          face_verification_status,
          convocation_status,
          queue_number,
          created_at
        FROM students
        WHERE id = ?
        LIMIT 1
        `
      )
      .bind(payload.id)
      .first();

    if (!student) {
      return jsonResponse(
        {
          success: false,
          message:
            "Student account not found.",
        },
        404
      );
    }

    return jsonResponse({
      success: true,
      student: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        course_code: student.course_code,
        course_name: student.course_name,
        session: student.session,
        phone_number: student.phone_number,
        faculty: student.faculty,
        cgpa: student.cgpa,
        verification_status:
          student.verification_status,
        face_registration_status:
          student.face_registration_status,
        face_verification_status:
          student.face_verification_status,
        convocation_status:
          student.convocation_status ||
          "registration",
        queue_number:
          student.queue_number,
        created_at: student.created_at,
      },
    });

  } catch (error) {
    console.error(
      "Student profile error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
      },
      500
    );
  }
}


// ============================================================
// UPDATE STUDENT PROFILE
// ============================================================

async function handleUpdateStudentProfile(
  request,
  env
) {
  try {
    const payload =
      await authenticateRequest(
        request,
        env,
        "student"
      );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid or expired token.",
        },
        401
      );
    }

    const body = await request.json();

    const phoneNumber =
      body.phone_number !== undefined
        ? String(body.phone_number).trim()
        : undefined;

    const faculty =
      body.faculty !== undefined
        ? String(body.faculty).trim()
        : undefined;

    if (
      phoneNumber === undefined &&
      faculty === undefined
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "No profile data provided.",
        },
        400
      );
    }

    const updates = [];
    const values = [];

    if (phoneNumber !== undefined) {
      updates.push(
        "phone_number = ?"
      );

      values.push(phoneNumber);
    }

    if (faculty !== undefined) {
      updates.push(
        "faculty = ?"
      );

      values.push(faculty);
    }

    values.push(payload.id);

    const result = await env.DB
      .prepare(
        `
        UPDATE students
        SET ${updates.join(", ")}
        WHERE id = ?
        `
      )
      .bind(...values)
      .run();

    if (!result.success) {
      return jsonResponse(
        {
          success: false,
          message:
            "Failed to update student profile.",
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      message:
        "Student profile updated successfully.",
    });

  } catch (error) {
    console.error(
      "Update student profile error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
      },
      500
    );
  }
}


// ============================================================
// STUDENT SIMULATION
// ============================================================

async function handleStudentSimulation(
  request,
  env
) {
  try {
    const payload =
      await authenticateRequest(
        request,
        env,
        "student"
      );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid or expired token.",
        },
        401
      );
    }

    const result = await env.DB
      .prepare(
        `
        SELECT
          student_id,
          name,
          course_code,
          course_name,
          verification_status,
          convocation_status,
          queue_number
        FROM students
        ORDER BY student_id ASC
        `
      )
      .all();

    const students =
      result.results || [];

    return jsonResponse({
      success: true,
      simulation: students,
    });

  } catch (error) {
    console.error(
      "Student simulation error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
      },
      500
    );
  }
}


// ============================================================
// STUDENT QUEUE
// ============================================================

async function handleStudentQueue(
  request,
  env
) {
  try {
    const payload =
      await authenticateRequest(
        request,
        env,
        "student"
      );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message:
            "Invalid or expired token.",
        },
        401
      );
    }

    const currentStudent =
      await env.DB
        .prepare(
          `
          SELECT
            id,
            student_id,
            name,
            email,
            course_code,
            course_name,
            session,
            verification_status,
            face_registration_status,
            face_verification_status,
            convocation_status,
            queue_number
          FROM students
          WHERE id = ?
          LIMIT 1
          `
        )
        .bind(payload.id)
        .first();

    if (!currentStudent) {
      return jsonResponse(
        {
          success: false,
          message:
            "Student account not found.",
        },
        404
      );
    }

    const queueResult =
      await env.DB
        .prepare(
          `
          SELECT
            id,
            student_id,
            name,
            course_code,
            course_name,
            session,
            verification_status,
            face_registration_status,
            face_verification_status,
            convocation_status,
            queue_number
          FROM students
          WHERE queue_number IS NOT NULL
          ORDER BY queue_number ASC
          `
        )
        .all();

    const queue =
      queueResult.results || [];

    let aheadOfYou = 0;

    if (
      currentStudent.queue_number !== null &&
      currentStudent.queue_number !== undefined
    ) {
      aheadOfYou = queue.filter(
        (student) => {
          if (
            student.queue_number === null ||
            student.queue_number === undefined
          ) {
            return false;
          }

          if (
            student.convocation_status ===
            "complete"
          ) {
            return false;
          }

          if (
            student.convocation_status ===
            "on_stage"
          ) {
            return false;
          }

          return (
            Number(
              student.queue_number
            ) <
            Number(
              currentStudent.queue_number
            )
          );
        }
      ).length;
    }

    const nowServingStudent =
      queue.find(
        (student) =>
          student.convocation_status ===
          "on_stage"
      ) || null;

    return jsonResponse({
      success: true,

      current_student: {
        id: currentStudent.id,
        student_id:
          currentStudent.student_id,
        name: currentStudent.name,
        email: currentStudent.email,
        course_code:
          currentStudent.course_code,
        course_name:
          currentStudent.course_name,
        session:
          currentStudent.session,
        verification_status:
          currentStudent.verification_status,
        face_registration_status:
          currentStudent.face_registration_status,
        face_verification_status:
          currentStudent.face_verification_status,
        convocation_status:
          currentStudent.convocation_status ||
          "registration",
        queue_number:
          currentStudent.queue_number,
      },

      ahead_of_you: aheadOfYou,

      now_serving:
        nowServingStudent
          ? {
              id:
                nowServingStudent.id,
              queue_number:
                nowServingStudent.queue_number,
              name:
                nowServingStudent.name,
              student_id:
                nowServingStudent.student_id,
            }
          : null,

      queue,
    });

  } catch (error) {
    console.error(
      "Student queue error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error.",
      },
      500
    );
  }
}

// ============================================================
// ADMIN PROFILE
// ============================================================

async function handleAdminProfile(request, env) {
  try {
    const payload = await authenticateRequest(
      request,
      env,
      "admin"
    );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid or expired token."
        },
        401
      );
    }

    const admin = await env.DB
      .prepare(`
        SELECT
          id,
          username,
          email,
          role,
          created_at
        FROM admins
        WHERE id = ?
        LIMIT 1
      `)
      .bind(payload.id)
      .first();

    if (!admin) {
      return jsonResponse(
        {
          success: false,
          message: "Admin account not found."
        },
        404
      );
    }

    return jsonResponse({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        created_at: admin.created_at
      }
    });

  } catch (error) {
    console.error(
      "Admin profile error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error."
      },
      500
    );
  }
} 


// ============================================================
// ADMIN DASHBOARD
// ============================================================
async function handleAdminDashboard(request, env) {
  try {
    const url = new URL(request.url);

    const session = url.searchParams.get("session") || "all";
    const date = url.searchParams.get("date") || "";

    let query = `
      SELECT
        id,
        student_id,
        name,
        email,
        course_code,
        course_name,
        session,
        faculty,
        cgpa,
        convocation_status,
        face_verification_status,
        queue_number
      FROM students
    `;

    const params = [];
    const conditions = [];

    if (session !== "all") {
      conditions.push("session = ?");
      params.push(session);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += `
      ORDER BY
        CASE
          WHEN queue_number IS NULL THEN 999999
          ELSE queue_number
        END ASC
    `;

    const result = await env.DB
      .prepare(query)
      .bind(...params)
      .all();

    const students = result.results || [];

    const registered = students.length;

    const verified = students.filter(
      student =>
        student.face_verification_status === "verified"
    ).length;

    const waiting = students.filter(
      student =>
        student.convocation_status === "queue" ||
        student.convocation_status === "seat_queue"
    ).length;

    const onStageStudent = students.find(
      student =>
        student.convocation_status === "on_stage"
    );

    const completed = students.filter(
      student =>
        student.convocation_status === "complete"
    ).length;

    const queue = students
      .filter(student => student.queue_number !== null)
      .slice(0, 5);

    return new Response(
      JSON.stringify({
        success: true,

        filters: {
          session,
          date
        },

        stats: {
          registered,
          verified,
          waiting,
          completed,
          on_stage: onStageStudent
            ? onStageStudent.queue_number
            : null
        },

        current_student: onStageStudent || null,

        queue
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error("Admin dashboard error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json"
        }
      }
    );
  }
}



// ============================================================
// ADMIN QUEUE
// ============================================================

async function handleAdminQueue(request, env) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        {
          success: false,
          message: "Authorization token is required.",
        },
        401
      );
    }

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid authorization format.",
        },
        401
      );
    }

    const token = authorization.substring(7).trim();

    if (!token) {
      return jsonResponse(
        {
          success: false,
          message: "Authentication token is required.",
        },
        401
      );
    }

    const payload = await verifyAuthToken(
      token,
      env.JWT_SECRET
    );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid or expired token.",
        },
        401
      );
    }

    if (payload.role !== "admin") {
      return jsonResponse(
        {
          success: false,
          message: "Admin access required.",
        },
        403
      );
    }

    const result = await env.DB
      .prepare(
        `
        SELECT
          id,
          student_id,
          name,
          email,
          course_code,
          course_name,
          session,
          phone_number,
          faculty,
          cgpa,
          verification_status,
          face_registration_status,
          face_verification_status,
          convocation_status,
          queue_number,
          created_at
        FROM students
        ORDER BY
          CASE
            WHEN queue_number IS NULL THEN 1
            ELSE 0
          END,
          queue_number ASC,
          student_id ASC
        `
      )
      .all();
      

    const students = result.results || [];

    const totalStudents = students.length;

    const registrationCount = students.filter(
      (student) =>
        student.convocation_status === "registration"
    ).length;

    const faceVerificationCount = students.filter(
      (student) =>
        student.convocation_status === "face_verification"
    ).length;

    const seatQueueCount = students.filter(
      (student) =>
        student.convocation_status === "seat_queue"
    ).length;

    const queueCount = students.filter(
      (student) =>
        student.convocation_status === "queue"
    ).length;

    const onStageCount = students.filter(
      (student) =>
        student.convocation_status === "on_stage"
    ).length;

    const completeCount = students.filter(
      (student) =>
        student.convocation_status === "complete"
    ).length;

    const queuedStudents = students.filter(
      (student) =>
        student.queue_number !== null &&
        student.queue_number !== undefined
    );

    const nowServingStudent =
      students.find(
        (student) =>
          student.convocation_status === "on_stage"
      ) || null;

    return jsonResponse({
      success: true,

      statistics: {
        total_students: totalStudents,
        registration: registrationCount,
        face_verification: faceVerificationCount,
        seat_queue: seatQueueCount,
        queue: queueCount,
        on_stage: onStageCount,
        complete: completeCount,
        total_queued: queuedStudents.length
      },

      now_serving: nowServingStudent
        ? {
            id: nowServingStudent.id,
            student_id: nowServingStudent.student_id,
            name: nowServingStudent.name,
            queue_number: nowServingStudent.queue_number
          }
        : null,

      students: students.map((student) => ({
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        email: student.email,
        course_code: student.course_code,
        course_name: student.course_name,
        session: student.session,
        phone_number: student.phone_number,
        faculty: student.faculty,
        cgpa: student.cgpa,
        verification_status:
          student.verification_status,
        face_registration_status:
          student.face_registration_status,
        face_verification_status:
          student.face_verification_status,
        convocation_status:
          student.convocation_status || "registration",
        queue_number:
          student.queue_number,
        created_at: student.created_at
      }))
    });

  } catch (error) {
    console.error(
      "Admin queue error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error."
      },
      500
    );
  }
}

async function handleAdminQueueStatusUpdate(request, env) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse(
        {
          success: false,
          message: "Authorization token is required."
        },
        401
      );
    }

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid authorization format."
        },
        401
      );
    }

    const token = authorization.substring(7).trim();

    const payload = await verifyAuthToken(
      token,
      env.JWT_SECRET
    );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid or expired token."
        },
        401
      );
    }

    if (payload.role !== "admin") {
      return jsonResponse(
        {
          success: false,
          message: "Admin access required."
        },
        403
      );
    }

    const body = await request.json();

    const studentId = body.student_id?.trim();
    const convocationStatus = body.convocation_status?.trim();
    const queueNumber =
      body.queue_number !== undefined &&
      body.queue_number !== null
        ? Number(body.queue_number)
        : null;

    if (!studentId) {
      return jsonResponse(
        {
          success: false,
          message: "Student ID is required."
        },
        400
      );
    }

    const allowedStatuses = [
      "registration",
      "face_verification",
      "seat_queue",
      "queue",
      "on_stage",
      "complete"
    ];

    if (
      !convocationStatus ||
      !allowedStatuses.includes(convocationStatus)
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid convocation status."
        },
        400
      );
    }

    if (
      queueNumber !== null &&
      (!Number.isInteger(queueNumber) || queueNumber < 1)
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Queue number must be a positive integer."
        },
        400
      );
    }

    const student = await env.DB
      .prepare(
        `
        SELECT
          id,
          student_id,
          name,
          queue_number,
          convocation_status
        FROM students
        WHERE student_id = ?
        LIMIT 1
        `
      )
      .bind(studentId)
      .first();

    if (!student) {
      return jsonResponse(
        {
          success: false,
          message: "Student not found."
        },
        404
      );
    }

    if (queueNumber !== null) {
      const duplicateQueue = await env.DB
        .prepare(
          `
          SELECT id, student_id
          FROM students
          WHERE queue_number = ?
            AND student_id != ?
          LIMIT 1
          `
        )
        .bind(queueNumber, studentId)
        .first();

      if (duplicateQueue) {
        return jsonResponse(
          {
            success: false,
            message:
              `Queue number ${queueNumber} is already assigned to another student.`
          },
          409
        );
      }
    }

    const result = await env.DB
      .prepare(
        `
        UPDATE students
        SET
          convocation_status = ?,
          queue_number = ?
        WHERE student_id = ?
        `
      )
      .bind(
        convocationStatus,
        queueNumber,
        studentId
      )
      .run();

    if (!result.success) {
      return jsonResponse(
        {
          success: false,
          message: "Failed to update student queue."
        },
        500
      );
    }

    const updatedStudent = await env.DB
      .prepare(
        `
        SELECT
          id,
          student_id,
          name,
          email,
          course_code,
          course_name,
          session,
          verification_status,
          face_registration_status,
          face_verification_status,
          convocation_status,
          queue_number
        FROM students
        WHERE student_id = ?
        LIMIT 1
        `
      )
      .bind(studentId)
      .first();

    return jsonResponse({
      success: true,
      message: "Student queue updated successfully.",
      student: updatedStudent
    });

  } catch (error) {
    console.error(
      "Admin queue update error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error."
      },
      500
    );
  }
}

async function handleAdminQueueNumberUpdate(request, env) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        {
          success: false,
          message: "Authorization token is required."
        },
        401
      );
    }

    const token = authorization.substring(7).trim();

    const payload = await verifyAuthToken(
      token,
      env.JWT_SECRET
    );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid or expired token."
        },
        401
      );
    }

    if (payload.role !== "admin") {
      return jsonResponse(
        {
          success: false,
          message: "Admin access required."
        },
        403
      );
    }

    const body = await request.json();

    const studentId = body.student_id?.trim();
    const queueNumber = body.queue_number;

    if (!studentId) {
      return jsonResponse(
        {
          success: false,
          message: "student_id is required"
        },
        400
      );
    }

    const number =
      queueNumber === null ||
      queueNumber === "" ||
      queueNumber === undefined
        ? null
        : Number(queueNumber);

    if (
      number !== null &&
      (!Number.isInteger(number) || number < 1)
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid queue number"
        },
        400
      );
    }

    const student = await env.DB
      .prepare(`
        SELECT id
        FROM students
        WHERE student_id = ?
        LIMIT 1
      `)
      .bind(studentId)
      .first();

    if (!student) {
      return jsonResponse(
        {
          success: false,
          message: "Student not found"
        },
        404
      );
    }

    if (number !== null) {
      const duplicate = await env.DB
        .prepare(`
          SELECT id
          FROM students
          WHERE queue_number = ?
            AND student_id != ?
          LIMIT 1
        `)
        .bind(number, studentId)
        .first();

      if (duplicate) {
        return jsonResponse(
          {
            success: false,
            message: `Queue number ${number} is already assigned to another student.`
          },
          409
        );
      }
    }

    await env.DB
      .prepare(`
        UPDATE students
        SET queue_number = ?
        WHERE student_id = ?
      `)
      .bind(number, studentId)
      .run();

    const updatedStudent = await env.DB
      .prepare(`
        SELECT
          id,
          student_id,
          name,
          course_code,
          course_name,
          face_verification_status,
          convocation_status,
          queue_number
        FROM students
        WHERE student_id = ?
        LIMIT 1
      `)
      .bind(studentId)
      .first();

    return jsonResponse({
      success: true,
      message: "Queue number updated",
      student: updatedStudent
    });

  } catch (error) {
    console.error(
      "Queue number update error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Failed to update queue number",
        error: error.message
      },
      500
    );
  }
}

// ============================================================
// GET ALL STUDENTS
// ============================================================

async function handleGetStudents(request, env) {
  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return jsonResponse(
        {
          success: false,
          message: "Authorization token is required."
        },
        401
      );
    }

    const token = authorization.substring(7).trim();

    const payload = await verifyAuthToken(
      token,
      env.JWT_SECRET
    );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid or expired token."
        },
        401
      );
    }

    if (payload.role !== "admin") {
      return jsonResponse(
        {
          success: false,
          message: "Admin access required."
        },
        403
      );
    }

    const result = await env.DB
      .prepare(`
        SELECT
          id,
          student_id,
          name,
          email,
          course_code,
          course_name,
          session,
          phone_number,
          faculty,
          cgpa,
          verification_status,
          face_registration_status,
          face_verification_status,
          convocation_status,
          queue_number,
          created_at
        FROM students
        ORDER BY student_id ASC
      `)
      .all();

    return jsonResponse({
      success: true,
      count: result.results?.length || 0,
      students: result.results || []
    });

  } catch (error) {
    console.error(
      "Get students error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error."
      },
      500
    );
  }
}

// ============================================================
// GET CORRECTION REQUESTS
// ============================================================

async function handleGetCorrectionRequests(request, env) {
  try {
    const payload = await authenticateRequest(
      request,
      env,
      "admin"
    );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid or expired token."
        },
        401
      );
    }

    const result = await env.DB
      .prepare(`
        SELECT
          cr.id,
          cr.student_id,
          cr.field_name,
          cr.old_value,
          cr.new_value,
          cr.reason,
          cr.status,
          cr.created_at,
          cr.reviewed_at,

          s.name,
          s.email,
          s.course_code,
          s.course_name,
          s.phone_number,
          s.faculty

        FROM correction_requests cr

        INNER JOIN students s
          ON s.student_id = cr.student_id

        WHERE cr.status = 'pending'

        ORDER BY cr.created_at ASC
      `)
      .all();

    return jsonResponse({
      success: true,
      count: result.results?.length || 0,
      requests: result.results || []
    });

  } catch (error) {
    console.error(
      "Get correction requests error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error."
      },
      500
    );
  }
}

// ============================================================
// APPROVE / REJECT CORRECTION REQUEST
// ============================================================

async function handleUpdateCorrectionRequest(request, env) {
  try {
    const payload = await authenticateRequest(
      request,
      env,
      "admin"
    );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid or expired token."
        },
        401
      );
    }

    const body = await request.json();

    const requestId = Number(body.id);
    const action = body.action?.trim().toLowerCase();

    if (!requestId) {
      return jsonResponse(
        {
          success: false,
          message: "Correction request ID is required."
        },
        400
      );
    }

    if (!["approved", "rejected"].includes(action)) {
      return jsonResponse(
        {
          success: false,
          message: "Action must be approved or rejected."
        },
        400
      );
    }

    const correctionRequest = await env.DB
      .prepare(`
        SELECT
          id,
          student_id,
          field_name,
          old_value,
          new_value,
          reason,
          status
        FROM correction_requests
        WHERE id = ?
        LIMIT 1
      `)
      .bind(requestId)
      .first();

    if (!correctionRequest) {
      return jsonResponse(
        {
          success: false,
          message: "Correction request not found."
        },
        404
      );
    }

    if (correctionRequest.status !== "pending") {
      return jsonResponse(
        {
          success: false,
          message: "This correction request has already been processed."
        },
        409
      );
    }

    if (action === "approved") {
      const allowedFields = [
        "name",
        "phone_number",
        "faculty",
        "course_code",
        "course_name"
      ];

      if (!allowedFields.includes(correctionRequest.field_name)) {
        return jsonResponse(
          {
            success: false,
            message: "This correction field is not allowed."
          },
          400
        );
      }

      const updateQuery = `
        UPDATE students
        SET ${correctionRequest.field_name} = ?
        WHERE student_id = ?
      `;

      const studentUpdate = await env.DB
        .prepare(updateQuery)
        .bind(
          correctionRequest.new_value,
          correctionRequest.student_id
        )
        .run();

      if (!studentUpdate.success) {
        return jsonResponse(
          {
            success: false,
            message: "Failed to update student information."
          },
          500
        );
      }
    }

    const result = await env.DB
      .prepare(`
        UPDATE correction_requests
        SET
          status = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = ?
        WHERE id = ?
      `)
      .bind(
        action,
        payload.id,
        requestId
      )
      .run();

    if (!result.success) {
      return jsonResponse(
        {
          success: false,
          message: "Failed to update correction request."
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      message:
        action === "approved"
          ? "Correction request approved successfully."
          : "Correction request rejected successfully.",
      request: {
        id: requestId,
        status: action
      }
    });

  } catch (error) {
    console.error(
      "Update correction request error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error."
      },
      500
    );
  }
}

async function handleFaceApprovalRequests(request, env) {
  try {
    const payload = await authenticateRequest(
      request,
      env,
      "admin"
    );

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid or expired token."
        },
        401
      );
    }

    const result = await env.DB
      .prepare(`
        SELECT
          id,
          student_id,
          name,
          email,
          course_code,
          course_name,
          session,
          face_registration_status,
          face_verification_status,
          convocation_status,
          created_at
        FROM students
        WHERE face_verification_status = 'pending'
        ORDER BY created_at ASC
      `)
      .all();

    return jsonResponse({
      success: true,
      count: result.results?.length || 0,
      approvals: result.results || []
    });

  } catch (error) {
    console.error(
      "Face approval requests error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message: "Internal server error."
      },
      500
    );
  }
}


// ============================================================
// AUTHENTICATE REQUEST
// ============================================================

async function authenticateRequest(
  request,
  env,
  requiredRole
) {
  try {
    const authorization =
      request.headers.get(
        "Authorization"
      );

    if (!authorization) {
      return null;
    }

    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return null;
    }

    const token =
      authorization
        .substring(7)
        .trim();

    if (!token) {
      return null;
    }

    const payload =
      await verifyAuthToken(
        token,
        env.JWT_SECRET
      );

    if (!payload) {
      return null;
    }

    if (
      payload.role !== requiredRole
    ) {
      return null;
    }

    return payload;

  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return null;
  }
}


// ============================================================
// CREATE AUTH TOKEN
// ============================================================

async function createAuthToken(
  user,
  secret
) {
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  const payload = {
    ...user,
    exp:
      Math.floor(
        Date.now() / 1000
      ) +
      60 * 60 * 24,
  };

  const encodedPayload =
    base64UrlEncode(
      JSON.stringify(payload)
    );

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(
        secret
      ),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(
        encodedPayload
      )
    );

  const encodedSignature =
    base64UrlEncode(
      new Uint8Array(
        signature
      )
    );

  return `${encodedPayload}.${encodedSignature}`;
}


// ============================================================
// VERIFY AUTH TOKEN
// ============================================================

async function verifyAuthToken(
  token,
  secret
) {
  try {
    if (!secret) {
      throw new Error(
        "JWT_SECRET is not configured."
      );
    }

    const parts =
      token.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [
      encodedPayload,
      encodedSignature,
    ] = parts;

    const signature =
      base64UrlDecodeBytes(
        encodedSignature
      );

    const key =
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(
          secret
        ),
        {
          name: "HMAC",
          hash: "SHA-256",
        },
        false,
        ["verify"]
      );

    const validSignature =
      await crypto.subtle.verify(
        "HMAC",
        key,
        signature,
        new TextEncoder().encode(
          encodedPayload
        )
      );

    if (!validSignature) {
      return null;
    }

    const payloadJson =
      base64UrlDecode(
        encodedPayload
      );

    const payload =
      JSON.parse(
        payloadJson
      );

    const currentTime =
      Math.floor(
        Date.now() / 1000
      );

    if (
      !payload.exp ||
      payload.exp <= currentTime
    ) {
      return null;
    }

    return payload;

  } catch (error) {
    console.error(
      "Token verification error:",
      error
    );

    return null;
  }
}


// ============================================================
// BASE64 URL ENCODE
// ============================================================

function base64UrlEncode(
  value
) {
  let binary;

  if (
    typeof value ===
    "string"
  ) {
    binary = value;
  } else {
    binary =
      String.fromCharCode(
        ...value
      );
  }

  return btoa(binary)
    .replace(
      /\+/g,
      "-"
    )
    .replace(
      /\//g,
      "_"
    )
    .replace(
      /=+$/,
      ""
    );
}


// ============================================================
// BASE64 URL DECODE
// ============================================================

function base64UrlDecode(
  value
) {
  let base64 =
    value
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );

  while (
    base64.length % 4
  ) {
    base64 += "=";
  }

  return atob(base64);
}


// ============================================================
// BASE64 URL DECODE BYTES
// ============================================================

function base64UrlDecodeBytes(
  value
) {
  const binary =
    base64UrlDecode(
      value
    );

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}


// ============================================================
// CORS
// ============================================================

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":
      "*",

    "Access-Control-Allow-Methods":
      "GET, POST, PUT, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",

    "Content-Type":
      "application/json",
  };
}


// ============================================================
// JSON RESPONSE
// ============================================================

function jsonResponse(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers:
        corsHeaders(),
    }
  );
}